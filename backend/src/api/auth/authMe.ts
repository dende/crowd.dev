import Error403 from '../../errors/Error403'

export default async (req, res) => {
  if (!req.currentUser || !req.currentUser.id) {
    await req.responseHandler.error(req, res, new Error403(req.language))
    return
  }

  const payload = req.currentUser

  console.log('remove')

  await req.responseHandler.success(req, res, payload)
}
