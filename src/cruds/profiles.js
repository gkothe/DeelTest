
const Util = require('../util.js');
const { QueryTypes, } = require("sequelize");
const moment = require("moment-timezone");
/**
TAale:
     id,
     firstName,
     lastName,
     profession,
     balance,
     type, -> client, contractor
     createdAt,
     updatedAt

 */
const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: "currency",
    currency: "USD",
});

module.exports = {
    async getBestClients({ app, ...params }, callback) {

        let obj = {
            start: { value: params.start, type: 'date', required: true, msg: "Starting date not informed or not a valid value." },
            end: { value: params.end, type: 'date', required: true, msg: "End date not informed or not a valid value." },
            limit: { value: params.limit ? params.limit : 2, type: 'int', required: true, msg: "Limit not informed or not a valid value." },
        }
        obj = Util.validateFields(obj);
        if (obj.errorMsg) {
            if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
        }

        // returns the clients the paid the most for jobs in the query time period. limit query parameter should be applied, default limit is 2.
        let query = ` 
            select sum(jobs.price) as total, client.firstName, client.lastName
                  
            from jobs 
            inner join contracts  on contracts.id = jobs.ContractId
            inner join profiles as client  on client.id = contracts.clientId
            
            where paid = 1
            and jobs.paymentDate between ? and ?
            group by client.firstName, client.lastName
            limit ?
            `
        //Date are always a bit tricky. not sure about the timezone and when dealing with something international.
        //For the sake of the exercise im not gonna set any timezone on the moment object (also im not even sure if I would need, since supposedly it comes in the input it self, I would be asking for someone in the team about this.  ).
        //im assuming that the incoming input is something that moment understands. Its also testing inside the validateFields with moment.
        
        let replacements = [
            moment(obj.start).format("YYYY-MM-DDTHH:MM:SS"),
            moment(obj.end).format("YYYY-MM-DDTHH:MM:SS"),
            obj.limit,
        ];
        const job_query = await app.get('sequelize').query(query, { replacements, type: QueryTypes.SELECT });

        if (!job_query || job_query.length === 0) {
            throw ({ code: 404, msg: "No jobs where paid in the given interval." });
        }

        if (callback) return callback(job_query, null);

    },
    async getBestProffesion({ app, ...params }, callback) {

        let obj = {
            start: { value: params.start, type: 'date', required: true, msg: "Starting date not informed or not a valid value." },
            end: { value: params.end, type: 'date', required: true, msg: "End date not informed or not a valid value." },
        }
        obj = Util.validateFields(obj);
        if (obj.errorMsg) {
            if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
        }

        //Returns the profession that earned the most money (sum of jobs paid) for any contactor that worked in the query time range.
        let query = ` 
            select sum(jobs.price) as total, contractor.profession
                  
            from jobs 
            inner join contracts  on contracts.id = jobs.ContractId
            inner join profiles as contractor  on contractor.id = contracts.ContractorId
            
            where paid = 1
            and jobs.paymentDate between ? and ?
            group by  contractor.profession order by total desc
            `

        //Date are always a bit tricky. not sure about the timezone and when dealing with something international.
        //For the sake of the exercise im not gonna set any timezone on the moment object (also im not even sure if I would need, since supposedly it comes in the input it self, I would be asking for someone in the team about this.  ).
        //im assuming that the incoming input is something that moment understands. Its also testing inside the validateFields with moment.
        //also not sure about what field to use in the where, so im using paymentDate. but maybe it should be jobs.createdAt or contracts.createdAt?
        let replacements = [
            moment(obj.start).format("YYYY-MM-DDTHH:MM:SS"),
            moment(obj.end).format("YYYY-MM-DDTHH:MM:SS"),
        ];
        const queryresult = await app.get('sequelize').query(query, { replacements, type: QueryTypes.SELECT });

        if (!queryresult || queryresult.length === 0) {
            throw ({ code: 404, msg: "No jobs where made in the given interval." });
        }

        if (callback) return callback(queryresult[0], null);

    },
    async postBalanceDeposit({ app, ...params }, callback) {
        //1. ***POST*** `/balances/deposit/:userId` - Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
        //so this was a little confusing, why im receveing the userId if i already have the profile_id? is there someone else trying to deposit for the user?
        //im gooing to assume that only the user can deposit for himself, so :userID == profile_id and use profile_id on the code.
        //Normally I would question the responsible about this.

        let obj = {
            profile_id: { value: params.profile?.id, type: 'int', required: true, msg: "Profile ID not informed or not a valid value." },
            deposit_value: { value: params.deposit_value, type: 'float', required: true, msg: "Deposit value not informed or not a valid value." },
        }
        obj = Util.validateFields(obj);
        if (obj.errorMsg) {
            if (callback) return callback(null, { code: 400, msg: obj.errorMsg });
        }

        let transaction = null;
        try {

            if (obj.deposit_value === 0) {
                throw ({ code: 422, msg: "You cannot deposit a amount of $0.00" });
            }

            let sequelize = app.get('sequelize');
            transaction = await sequelize.transaction();

            let query = ` 
            select sum(price) as value_to_pay, client.balance
                    
            from jobs 
            inner join contracts   on contracts.id = jobs.ContractId
            inner join profiles as client  on client.id = contracts.ClientId

            where  contracts.ClientId = ? and paid is null group by client.balance
            `
            const job_query = await app.get('sequelize').query(query, { transaction, replacements: [obj.profile_id], type: QueryTypes.SELECT });

            if (!job_query || job_query.length === 0) {
                throw ({ code: 404, msg: "You have no jobs pending to pay, no need for deposit." });
            }
            var rows = job_query[0];

            if (rows.value_to_pay === 0) {//maybe there was a free job(price 0)?
                throw ({ code: 404, msg: "You have no jobs pending to pay, no need for deposit." });
            }

            let maxAmountToDesposit = rows.value_to_pay * 1.25;
            //Deposits money into the the the balance of a client, a client can't deposit more than 25% his total of jobs to pay. (at the deposit moment)
            //OBs: the rule doest say anything about the existing balance. Normally I would question the responsible if this should be considered.
            if (obj.deposit_value > maxAmountToDesposit) {
                throw ({ code: 404, msg: "You can't deposit more than 25% of your total of jobs to pay. The total you have to pay is " + dollarUSLocale.format(maxAmountToDesposit) });
            }

            const ClientModel = app.get('models').Profile;
            await ClientModel.update({ balance: obj.deposit_value + rows.balance }, { where: { id: obj.profile_id }, transaction, })


            transaction.commit();
            if (callback) return callback({ ok: true }, null);
        } catch (e) {
            console.log(e);
            transaction.rollback();
            if (callback) return callback(null, e);
        }

    }
}
