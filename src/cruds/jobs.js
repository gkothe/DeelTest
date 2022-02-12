
const Util = require('../util.js');
const { QueryTypes, Sequelize } = require("sequelize");
/**
TAale:
        id	
        description	
        price	
        paid
        paymentDate	
        createdAt
        updatedAt	
        ContractId

 */

module.exports = {
    async getJobsUnpaid({ app, ...params }, callback) {
        let obj = {
            profile_id: { value: params.profile?.id, type: 'int', required: true, msg: "Profile ID not informed or not a valid value." },
        }
        obj = Util.validateFields(obj);
        if (obj.errorMsg) {
            if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
        }

        let query = `
        select jobs.*,
            CASE
                WHEN ContractorId == :profile_id THEN 'Contractor'
                WHEN ClientId == :profile_id THEN 'Client' 
            end as typeofuser
            from jobs 
            inner join contracts   on contracts.id = jobs.ContractId
            where paid is null and status = 'in_progress' and (ContractorId = :profile_id or ClientId = :profile_id)
        `
        const jobs = await app.get('sequelize').query(query, { replacements: { profile_id: obj.profile_id }, type: QueryTypes.SELECT });
        if (jobs) {
            if (callback) return callback(jobs, null);
        } else
            if (callback) return callback(null, { code: 404, msg: "Jobs not Found" });
    },
}
