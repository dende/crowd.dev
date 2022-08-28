import OrganizationRepository from '../organizationRepository'
import SequelizeTestUtils from '../../utils/sequelizeTestUtils'
import Error404 from '../../../errors/Error404'
import CommunityMemberRepository from '../communityMemberRepository'

const db = null

const toCreate = {
  name: 'crowd.dev',
  url: 'https://crowd.dev',
  description: 'Community-led Growth for Developer-first Companies.\nJoin our private beta',
  emails: ['hello@crowd.dev', 'jonathan@crow.dev'],
  phoneNumbers: ['+42 424242424'],
  logo: 'https://logo.clearbit.com/crowd.dev',
  tags: ['community', 'growth', 'developer-first'],
  parentUrl: null,
  twitter: {
    handle: 'CrowdDotDev',
    id: '1362101830923259908',
    bio: 'Community-led Growth for Developer-first Companies.\nJoin our private beta. 👇',
    followers: 107,
    following: 0,
    location: '🌍 remote',
    site: 'https://t.co/GRLDhqFWk4',
    avatar: 'https://pbs.twimg.com/profile_images/1419741008716251141/6exZe94-_normal.jpg',
  },
  linkedin: {
    handle: 'company/crowddevhq',
  },
  crunchbase: {
    handle: 'company/crowddevhq',
  },
  employees: 42,
  revenueRange: [10, 50],
}

async function createMembers(options) {
  return [
    (
      await CommunityMemberRepository.create(
        {
          username: { crowdUsername: 'gilfoyle' },
          joinedAt: '2020-05-27T15:13:30Z',
        },
        options,
      )
    ).id,
    (
      await CommunityMemberRepository.create(
        {
          username: { crowdUsername: 'dinesh' },
          joinedAt: '2020-06-27T15:13:30Z',
        },
        options,
      )
    ).id,
  ]
}

describe('OrganizationRepository tests', () => {
  beforeEach(async () => {
    await SequelizeTestUtils.wipeDatabase(db)
  })

  afterAll((done) => {
    // Closing the DB connection allows Jest to exit successfully.
    SequelizeTestUtils.closeConnection(db)
    done()
  })

  describe('create method', () => {
    it('Should create the given organization succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organizationCreated = await OrganizationRepository.create(
        toCreate,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationCreated = {
        id: organizationCreated.id,
        ...toCreate,
        communityMemberCount: 0,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(organizationCreated).toStrictEqual(expectedOrganizationCreated)
    })

    it('Should throw sequelize not null error -- name field is required', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization2add = {}

      await expect(() =>
        OrganizationRepository.create(organization2add, mockIRepositoryOptions),
      ).rejects.toThrow()
    })

    it('Should create an organization with community members succesfully', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const memberIds = await createMembers(mockIRepositoryOptions)

      const toCreateWithMember = {
        ...toCreate,
        communityMembers: memberIds,
      }
      const organizationCreated = await OrganizationRepository.create(
        toCreateWithMember,
        mockIRepositoryOptions,
      )
      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationCreated = {
        id: organizationCreated.id,
        ...toCreate,
        communityMemberCount: 2,
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      expect(organizationCreated).toStrictEqual(expectedOrganizationCreated)

      const member1 = await CommunityMemberRepository.findById(memberIds[0], mockIRepositoryOptions)
      const member2 = await CommunityMemberRepository.findById(memberIds[1], mockIRepositoryOptions)
      expect(member1.organizations).toStrictEqual([organizationCreated.url])
      expect(member2.organizations).toStrictEqual([organizationCreated.url])
    })
  })

  describe('findById method', () => {
    it('Should successfully find created organization by id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization2add = { name: 'test-organization' }

      const organizationCreated = await OrganizationRepository.create(
        organization2add,
        mockIRepositoryOptions,
      )

      organizationCreated.createdAt = organizationCreated.createdAt.toISOString().split('T')[0]
      organizationCreated.updatedAt = organizationCreated.updatedAt.toISOString().split('T')[0]

      const expectedOrganizationFound = {
        id: organizationCreated.id,
        name: organization2add.name,
        communityMembers: [],
        importHash: null,
        createdAt: SequelizeTestUtils.getNowWithoutTime(),
        updatedAt: SequelizeTestUtils.getNowWithoutTime(),
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
      }
      const organizationById = await OrganizationRepository.findById(
        organizationCreated.id,
        mockIRepositoryOptions,
      )

      organizationById.createdAt = organizationById.createdAt.toISOString().split('T')[0]
      organizationById.updatedAt = organizationById.updatedAt.toISOString().split('T')[0]

      expect(organizationById).toStrictEqual(expectedOrganizationFound)
    })

    it('Should throw 404 error when no organization found with given id', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)
      const { randomUUID } = require('crypto')

      await expect(() =>
        OrganizationRepository.findById(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('filterIdsInTenant method', () => {
    it('Should return the given ids of previously created organization entities', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization1 = { name: 'test1' }
      const organization2 = { name: 'test2' }

      const organization1Created = await OrganizationRepository.create(
        organization1,
        mockIRepositoryOptions,
      )
      const organization2Created = await OrganizationRepository.create(
        organization2,
        mockIRepositoryOptions,
      )

      const filterIdsReturned = await OrganizationRepository.filterIdsInTenant(
        [organization1Created.id, organization2Created.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([organization1Created.id, organization2Created.id])
    })

    it('Should only return the ids of previously created organizations and filter random uuids out', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = { name: 'test1' }

      const organizationCreated = await OrganizationRepository.create(
        organization,
        mockIRepositoryOptions,
      )

      const { randomUUID } = require('crypto')

      const filterIdsReturned = await OrganizationRepository.filterIdsInTenant(
        [organizationCreated.id, randomUUID(), randomUUID()],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([organizationCreated.id])
    })

    it('Should return an empty array for an irrelevant tenant', async () => {
      let mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = { name: 'test' }

      const organizationCreated = await OrganizationRepository.create(
        organization,
        mockIRepositoryOptions,
      )

      // create a new tenant and bind options to it
      mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const filterIdsReturned = await OrganizationRepository.filterIdsInTenant(
        [organizationCreated.id],
        mockIRepositoryOptions,
      )

      expect(filterIdsReturned).toStrictEqual([])
    })
  })

  describe('findAndCountAll method', () => {
    it('Should find and count all organizations, with various filters', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization1 = { name: 'test-organization' }
      const organization2 = { name: 'test-organization-2' }
      const organization3 = { name: 'another-organization' }

      const organization1Created = await OrganizationRepository.create(
        organization1,
        mockIRepositoryOptions,
      )
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const organization2Created = await OrganizationRepository.create(
        organization2,
        mockIRepositoryOptions,
      )
      await new Promise((resolve) => {
        setTimeout(resolve, 50)
      })

      const organization3Created = await OrganizationRepository.create(
        organization3,
        mockIRepositoryOptions,
      )

      // Test filter by name
      // Current findAndCountAll uses wildcarded like statement so it matches both organizations
      let organizations = await OrganizationRepository.findAndCountAll(
        { filter: { name: 'test-organization' } },
        mockIRepositoryOptions,
      )

      expect(organizations.count).toEqual(2)
      expect(organizations.rows).toStrictEqual([organization2Created, organization1Created])

      // Test filter by id
      organizations = await OrganizationRepository.findAndCountAll(
        { filter: { id: organization1Created.id } },
        mockIRepositoryOptions,
      )

      expect(organizations.count).toEqual(1)
      expect(organizations.rows).toStrictEqual([organization1Created])

      // Test filter by createdAt - find all between organization1.createdAt and organization3.createdAt
      organizations = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [organization1Created.createdAt, organization3Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )

      expect(organizations.count).toEqual(3)
      expect(organizations.rows).toStrictEqual([
        organization3Created,
        organization2Created,
        organization1Created,
      ])

      // Test filter by createdAt - find all where createdAt < organization2.createdAt
      organizations = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, organization2Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(organizations.count).toEqual(2)
      expect(organizations.rows).toStrictEqual([organization2Created, organization1Created])

      // Test filter by createdAt - find all where createdAt < organization1.createdAt
      organizations = await OrganizationRepository.findAndCountAll(
        {
          filter: {
            createdAtRange: [null, organization1Created.createdAt],
          },
        },
        mockIRepositoryOptions,
      )
      expect(organizations.count).toEqual(1)
      expect(organizations.rows).toStrictEqual([organization1Created])
    })
  })

  describe('update method', () => {
    it('Should succesfully update previously created organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization1 = { name: 'test-organization' }

      const organizationCreated = await OrganizationRepository.create(
        organization1,
        mockIRepositoryOptions,
      )

      const organizationUpdated = await OrganizationRepository.update(
        organizationCreated.id,
        { name: 'updated-organization-name' },
        mockIRepositoryOptions,
      )

      expect(organizationUpdated.updatedAt.getTime()).toBeGreaterThan(
        organizationUpdated.createdAt.getTime(),
      )

      const organizationExpected = {
        id: organizationCreated.id,
        name: organizationUpdated.name,
        importHash: null,
        createdAt: organizationCreated.createdAt,
        updatedAt: organizationUpdated.updatedAt,
        deletedAt: null,
        tenantId: mockIRepositoryOptions.currentTenant.id,
        createdById: mockIRepositoryOptions.currentUser.id,
        updatedById: mockIRepositoryOptions.currentUser.id,
        communityMembers: [],
      }

      expect(organizationUpdated).toStrictEqual(organizationExpected)
    })

    it('Should throw 404 error when trying to update non existent organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        OrganizationRepository.update(
          randomUUID(),
          { name: 'non-existent' },
          mockIRepositoryOptions,
        ),
      ).rejects.toThrowError(new Error404())
    })
  })

  describe('destroy method', () => {
    it('Should succesfully destroy previously created organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const organization = { name: 'test-organization' }

      const returnedOrganization = await OrganizationRepository.create(
        organization,
        mockIRepositoryOptions,
      )

      await OrganizationRepository.destroy(returnedOrganization.id, mockIRepositoryOptions, true)

      // Try selecting it after destroy, should throw 404
      await expect(() =>
        OrganizationRepository.findById(returnedOrganization.id, mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })

    it('Should throw 404 when trying to destroy a non existent organization', async () => {
      const mockIRepositoryOptions = await SequelizeTestUtils.getTestIRepositoryOptions(db)

      const { randomUUID } = require('crypto')

      await expect(() =>
        OrganizationRepository.destroy(randomUUID(), mockIRepositoryOptions),
      ).rejects.toThrowError(new Error404())
    })
  })
})
