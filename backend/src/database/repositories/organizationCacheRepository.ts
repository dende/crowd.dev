import lodash from 'lodash'
import SequelizeRepository from './sequelizeRepository'
import AuditLogRepository from './auditLogRepository'
import Error404 from '../../errors/Error404'
import { IRepositoryOptions } from './IRepositoryOptions'

class organizationCacheRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.organizationCache.create(
      {
        ...lodash.pick(data, [
          'name',
          'url',
          'description',
          'parentUrl',
          'emails',
          'phoneNumbers',
          'logo',
          'tags',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'revenueRange',
          'importHash',
        ]),

        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.CREATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    let record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, [
          'name',
          'url',
          'description',
          'parentUrl',
          'emails',
          'phoneNumbers',
          'logo',
          'tags',
          'twitter',
          'linkedin',
          'crunchbase',
          'employees',
          'revenueRange',
          'importHash',
        ]),
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    await this._createAuditLog(AuditLogRepository.UPDATE, record, data, options)

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions, force = false) {
    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    await record.destroy({
      transaction,
      force,
    })

    await this._createAuditLog(AuditLogRepository.DELETE, record, record, options)
  }

  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return record.get({ plain: true })
  }

  static async findByUrl(url, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const record = await options.database.organizationCache.findOne({
      where: {
        url,
      },
      include,
      transaction,
    })

    if (!record) {
      return undefined
    }

    return record.get({ plain: true })
  }

  static async _createAuditLog(action, record, data, options: IRepositoryOptions) {
    let values = {}

    if (data) {
      values = {
        ...record.get({ plain: true }),
      }
    }

    await AuditLogRepository.log(
      {
        entityName: 'organizationCache',
        entityId: record.id,
        action,
        values,
      },
      options,
    )
  }
}

export default organizationCacheRepository
