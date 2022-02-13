
const Util = require('../util.js');
const { Op } = require("sequelize");
/**
  Table Fields:
   id
   terms:
   status -> `new`, `in_progress`, `terminated`
   ClientId
   ContractorId
   createdAt
   updatedAt
 */

async function getContractId({ app, ...params }, callback) {
    var obj = {
        id: { value: params.id, type: 'int', required: true, msg: "ID not informed or not a valid value." },
        profile_id: { value: params.profile?.id, type: 'int', required: true, msg: "Profile ID not informed or not a valid value." },
    }
    obj = Util.validateFields(obj);
    if (obj.errorMsg) {
        if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
    }
    var { Contract } = app.get('models')
    var query = {
        id: obj.id,
        [Op.or]: [{ ClientId: obj.profile_id }, { ContractorId: obj.profile_id },]
    };
    var contract = await Contract.findOne({ where: query })
    if (contract) {
        if (callback) return callback(contract, null);
    } else
        if (callback) return callback(null, { code: 404, msg: "Contract not Found" });
}

async function getContractsList({ app, ...params }, callback) {
    var obj = {
        profile_id: { value: params.profile?.id, type: 'int', required: true, msg: "Profile ID not informed or not a valid value." },
    }
    obj = Util.validateFields(obj);
    if (obj.errorMsg) {
        if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
    }
    var { Contract } = app.get('models')
    var query = {
        status: {
            [Op.or]: ["new", "in_progress"]
        },
        [Op.or]: [{ ClientId: obj.profile_id }, { ContractorId: obj.profile_id },]
    };
    var contract = await Contract.findAll({ where: query })
    if (contract) {
        if (callback) return callback(contract, null);
    } else
        if (callback) return callback(null, { code: 404, msg: "Contract not Found" });
}

module.exports = {
    getContractsList,
    getContractId
}
