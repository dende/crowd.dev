from qdrant_client import QdrantClient
from qdrant_client.http import models
import datetime
import time
from crowd.eagle_eye.apis import CohereAPI
import logging
import itertools
import os
from crowd.eagle_eye.config import KUBE_MODE, VECTOR_API_KEY, VECTOR_INDEX

logger = logging.getLogger(__name__)


class VectorAPI:
    """
    Class to interact with the vector database.
    """

    def __init__(self, index_name=None, do_init=False):
        """
        Initialize the VectorAPI.

        Args:
            index_name (str, optional): Name of the DB index. Defaults to "crowddev".
        """
        self.collection_name = "crowddev"
        self.client = QdrantClient(host="localhost", port=6333)

        if index_name is None:
            if KUBE_MODE:
                index_name = VECTOR_INDEX
            else:
                index_name = os.environ.get('VECTOR_INDEX')

        if do_init:
            self.index = self.client.recreate_collection(
                name=self.collection_name,
                vectors_config=models.VectorParams(size=768, distance=models.Distance.COSINE),
            )

    @staticmethod
    def _chunks(iterable, batch_size=80):
        """A helper function to break an iterable into chunks of size batch_size.
        https://www.pinecone.io/docs/insert-data/#batching-upserts.

        Args:
            iterable (iterable): The iterable to break into chunks.
            batch_size (int, optional): The size of each chunk. Defaults to 80.
        """
        it = iter(iterable)
        chunk = tuple(itertools.islice(it, batch_size))
        while chunk:
            yield chunk
            chunk = tuple(itertools.islice(it, batch_size))

    def upsert(self, points):
        """
        Upsert a list of points into the vector database.

        Args:
            points ([Point]): points to upsert.
        """
        if (len(points) == 0):
            return

        # Pinecone needs the points converted into tuples
        vectors = [
            models.PointStruct(
                id=point.id,
                payload=point.payload_as_dict(),
                vector=point.embed,
            ) for point in points
        ]

        for vectors_chunk in VectorAPI._chunks(vectors, batch_size=100):
            self.client.upsert(
                collection_name=self.collection_name,
                points=vectors_chunk
            )

        return "OK"

    @ staticmethod
    def _get_timestamp(ndays, start=int(time.time())):
        """
        Get the unix timestamp for a given number of days ago.

        Args:
            ndays (int): number of days ago.
            start (int, optional): start timestamp. Defaults to int(time.time()).

        Returns:
            int: timestamp
        """
        now = datetime.datetime.fromtimestamp(start)
        return int((now - datetime.timedelta(days=ndays)).timestamp())

    def find_existing_ids(self, ids):
        """
        Given a list of ids, find which ones already exist in the vector database.

        Args:
            ids ([str]): list of ids to find.

        Returns:
            [str]: list of existing ids.
        """
        existing = self.client.retrieve(
            collection_name=self.collection_name,
            ids=ids,
        )
        return [point.id for point in existing.get("result", [])]

    def delete(self, ids):
        """
        Delete a list of ids from the vector database.

        Args:
            ids ([str]): list of ids to delete.

        Returns:
            str: success message.
        """
        if type(ids) == str:
            ids = [ids]
        self.client.delete(
            collection_name=self.collection_name,
            points_selector=models.PointIdsList(
                points=ids
            ),
        )

    def search(self, query, ndays, exclude, cohere=None):
        """
        Perform a search on the vector database.
        We can set number of days ago, and exclude certain ids.

        Args:
            query (str): query to perform, for example a keyword
            ndays (int): maximum number of days ago to search
            exclude ([str]): list of ids to exclude from the search
            cohere (CohereAPI, optional): Already initialised CohereAPI. Defaults to None.

        Returns:
            [dict]: list of results
        """
        if cohere is None:
            cohere = CohereAPI()
        start = self._get_timestamp(ndays)

        # Embed the query into a vector
        vector = cohere.embed_one(query)

        return self.index.query(
            vector=vector,
            top_k=20,
            filter={
                "timestamp": {"$gte": start},
                "vectorId": {"$nin": exclude}
            },
            includeMetadata=True
        )
