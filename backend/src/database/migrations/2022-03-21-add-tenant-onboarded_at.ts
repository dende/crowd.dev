export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.addColumn('tenants', 'onboardedAt', Sequelize.DATE)
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.removeColumn('tenants', 'onboardedAt')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}