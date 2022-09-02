import lodash from 'lodash'
import Sequelize from 'sequelize'
import SequelizeRepository from './sequelizeRepository'
import { IRepositoryOptions } from './IRepositoryOptions'
import Error404 from '../../errors/Error404'
import SequelizeFilterUtils from '../utils/sequelizeFilterUtils'

const Op = Sequelize.Op

class MemberAttributeSettingsRepository {
  static async findById(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const include = []

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.memberAttributeSettings.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      include,
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    return this._populateRelations(record)
  }

  static async _populateRelations(record) {
    if (!record) {
      return record
    }
    const output = record.get({ plain: true })

    return output
  }

  static async create(data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const tenant = SequelizeRepository.getCurrentTenant(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const record = await options.database.memberAttributeSettings.create(
      {
        ...lodash.pick(data, ['type', 'name', 'label', 'canDelete', 'show']),

        tenantId: tenant.id,
        createdById: currentUser.id,
        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    return this.findById(record.id, options)
  }

  static async update(id, data, options: IRepositoryOptions) {
    const currentUser = SequelizeRepository.getCurrentUser(options)

    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    let record = await options.database.memberAttributeSettings.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    record = await record.update(
      {
        ...lodash.pick(data, ['type', 'name', 'label', 'canDelete', 'show']),

        updatedById: currentUser.id,
      },
      {
        transaction,
      },
    )

    return this.findById(record.id, options)
  }

  static async destroy(id, options: IRepositoryOptions) {
    const transaction = SequelizeRepository.getTransaction(options)

    const currentTenant = SequelizeRepository.getCurrentTenant(options)

    const record = await options.database.memberAttributeSettings.findOne({
      where: {
        id,
        tenantId: currentTenant.id,
      },
      transaction,
    })

    if (!record) {
      throw new Error404()
    }

    if (record.canDelete){
      await record.destroy({
        transaction,
      })
    }

  }


  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = '' },
    options: IRepositoryOptions,
  ) {
    const tenant = SequelizeRepository.getCurrentTenant(options)

    const whereAnd: Array<any> = []
    const include = []

    whereAnd.push({
      tenantId: tenant.id,
    })

    if (filter) {
      if (filter.id) {
        whereAnd.push({
          id: SequelizeFilterUtils.uuid(filter.id),
        })
      }

      if (
        filter.canDelete === true ||
        filter.canDelete === 'true' ||
        filter.canDelete === false ||
        filter.canDelete === 'false'
      ) {
        whereAnd.push({
          canDelete: filter.canDelete === true || filter.canDelete === 'true',
        })
      }

      if (
        filter.show === true ||
        filter.show === 'true' ||
        filter.show === false ||
        filter.show === 'false'
      ) {
        whereAnd.push({
          show: filter.show === true || filter.show === 'true',
        })
      }

      if (filter.type) {
        whereAnd.push({
          type: filter.type,
        })
      }

      if (filter.label) {
        whereAnd.push({
          label: filter.label,
        })
      }

      if (filter.name) {
        whereAnd.push({
          name: filter.name,
        })
      }



      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange

        if (start !== undefined && start !== null && start !== '') {
          whereAnd.push({
            createdAt: {
              [Op.gte]: start,
            },
          })
        }

        if (end !== undefined && end !== null && end !== '') {
          whereAnd.push({
            createdAt: {
              [Op.lte]: end,
            },
          })
        }
      }
    }

    const where = { [Op.and]: whereAnd }

    // eslint-disable-next-line prefer-const
    let { rows, count } = await options.database.memberAttributeSettings.findAndCountAll({
      where,
      include,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
      order: orderBy ? [orderBy.split('_')] : [['createdAt', 'DESC']],
      transaction: SequelizeRepository.getTransaction(options),
    })

    rows = await this._populateRelationsForRows(rows)

    return { rows, count }
  }

  static async _populateRelationsForRows(rows) {
    if (!rows) {
      return rows
    }

    return Promise.all(rows.map((record) => this._populateRelations(record)))
  }
}

export default MemberAttributeSettingsRepository
