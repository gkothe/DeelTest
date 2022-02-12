
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
        contracts.ContractorId,
        contracts.ClientId,
        contracts.status,
            CASE
                WHEN ContractorId == :profile_id THEN 'Contractor'
                WHEN ClientId == :profile_id THEN 'Client' 
            end as typeofuser
            from jobs 
            inner join contracts   on contracts.id = jobs.ContractId
            where paid is null and status = 'in_progress' and (contracts.ContractorId = :profile_id or contracts.ClientId = :profile_id)
        `
        const jobs = await app.get('sequelize').query(query, { replacements: { profile_id: obj.profile_id }, type: QueryTypes.SELECT });
        if (jobs) {
            if (callback) return callback(jobs, null);
        } else
            if (callback) return callback(null, { code: 404, msg: "Jobs not Found" });
    },
    async postJobsPay({ app, ...params }, callback) {

        let obj = {
            profile_id: { value: params.profile?.id, type: 'int', required: true, msg: "Profile ID not informed or not a valid value." },
            job_id: { value: params.job_id, type: 'int', required: true, msg: "Jobs ID not informed or not a valid value." },
        }
        obj = Util.validateFields(obj);
        if (obj.errorMsg) {
            if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
        }
        let transaction = null;
        try {
            let sequelize = app.get('sequelize');
            transaction = await sequelize.transaction();
            //test if the job is from the client.
            let query = ` 
               select jobs.*, 
               client. balance as client_balance, client.id as client_id, 
               contractor. balance as contractor_balance, contractor.id as contractor_id
                    
               from jobs 
               inner join contracts   on contracts.id = jobs.ContractId
               inner join profiles as client  on client.id = contracts.ClientId
               inner join profiles as contractor  on contractor.id = contracts.ContractorId

               where jobs.id = ? and  contracts.ClientId = ?
        `
            const job_query = await app.get('sequelize').query(query, { transaction, replacements: [obj.job_id, obj.profile_id], type: QueryTypes.SELECT });
            if (!job_query || job_query.length === 0) {
                throw ({ code: 404, msg: "Job not Found" });
            }

            var job = job_query[0];
            if (job.paid === 1) {
                throw ({ code: 422, msg: "Job already paid." });
            }
            if (job.price > job.client_balance) {
                throw ({ code: 422, msg: "Insufficient account balance." });
            }

            let newClientBalance = job.client_balance - job.price;
            let newContractorBalance = job.contractor_balance + job.price;

            const Jobs = app.get('models').Job;
            await Jobs.update({ paid: 1, paymentDate: new Date() }, { where: { id: job.id }, transaction, })

            const ClientModel = app.get('models').Profile;
            await ClientModel.update({ balance: newClientBalance, }, { where: { id: job.client_id }, transaction, })

            const ContractorModel = app.get('models').Profile;
            await ContractorModel.update({ balance: newContractorBalance, }, { where: { id: job.contractor_id }, transaction, })

            transaction.commit();
            if (callback) return callback({ ok: true }, null);
        } catch (e) {
            console.log(e);
            transaction.rollback();
            if (callback) return callback(null, e);
        }

    }
}
