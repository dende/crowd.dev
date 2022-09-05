import Error400 from '../errors/Error400'
import SequelizeRepository from '../database/repositories/sequelizeRepository'
import { IServiceOptions } from './IServiceOptions'
import OrganizationRepository from '../database/repositories/organizationRepository'
import MemberRepository from '../database/repositories/memberRepository'
import { getConfig } from '../config'
import organizationCacheRepository from '../database/repositories/organizationCacheRepository'
import { enrichOrganization, organizationUrlFromName } from './helpers/enrichment'

export default class OrganizationService {
  options: IServiceOptions

  constructor(options) {
    this.options = options
  }

  static async shouldEnrich(enrichP) {
    const isPremium = true
    if (!isPremium) {
      return false
    }
    return enrichP && (getConfig().CLEARBIT_API_KEY || getConfig().NODE_ENV === 'test')
  }

  async create(data, enrichP = true) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (await OrganizationService.shouldEnrich(enrichP)) {
        if (!data.name && !data.url) {
          throw new Error400(this.options.language, 'errors.OrganizationNameOrUrlRequired.message')
        }
        if (data.name && !data.url) {
          try {
            data.url = await organizationUrlFromName(data.name)
          } catch (error) {
            console.log(`Could not get URL for ${data.name}: ${error}`)
          }
        }
        if (data.url) {
          const existing = await organizationCacheRepository.findByUrl(data.url, this.options)
          if (existing) {
            data = {
              ...data,
              ...existing,
            }
          } else {
            try {
              const enrichedData = await enrichOrganization(data.url)
              data = {
                ...data,
                ...enrichedData,
              }
            } catch (error) {
              console.log(`Could not enrich ${data.url}: ${error}`)
            }
          }
        }
      }

      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      const record = await OrganizationRepository.create(data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'organization')

      throw error
    }
  }

  async update(id, data) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      if (data.members) {
        data.members = await MemberRepository.filterIdsInTenant(data.members, {
          ...this.options,
          transaction,
        })
      }

      const record = await OrganizationRepository.update(id, data, {
        ...this.options,
        transaction,
      })

      await SequelizeRepository.commitTransaction(transaction)

      return record
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)

      SequelizeRepository.handleUniqueFieldError(error, this.options.language, 'organization')

      throw error
    }
  }

  async destroyAll(ids) {
    const transaction = await SequelizeRepository.createTransaction(this.options.database)

    try {
      for (const id of ids) {
        await OrganizationRepository.destroy(
          id,
          {
            ...this.options,
            transaction,
          },
          true,
        )
      }

      await SequelizeRepository.commitTransaction(transaction)
    } catch (error) {
      await SequelizeRepository.rollbackTransaction(transaction)
      throw error
    }
  }

  async findById(id) {
    return OrganizationRepository.findById(id, this.options)
  }

  async findAllAutocomplete(search, limit) {
    return OrganizationRepository.findAllAutocomplete(search, limit, this.options)
  }

  async findAndCountAll(args) {
    return OrganizationRepository.findAndCountAll(args, this.options)
  }

  async import(data, importHash) {
    if (!importHash) {
      throw new Error400(this.options.language, 'importer.errors.importHashRequired')
    }

    if (await this._isImportHashExistent(importHash)) {
      throw new Error400(this.options.language, 'importer.errors.importHashExistent')
    }

    const dataToCreate = {
      ...data,
      importHash,
    }

    return this.create(dataToCreate)
  }

  async _isImportHashExistent(importHash) {
    const count = await OrganizationRepository.count(
      {
        importHash,
      },
      this.options,
    )

    return count > 0
  }
}
