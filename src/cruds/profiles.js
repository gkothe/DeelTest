
const Util = require('../util.js');
const { QueryTypes, } = require("sequelize");
/**
TAale:
     id,
     firstName,
     lastName,
     profession,
     balance,
     type,
     createdAt,
     updatedAt

 */
const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: "currency",
    currency: "USD",
});

module.exports = {
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
            //test if the job is from the client.
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
