const { sequelize } = require('./model')
const express = require('express');
const bodyParser = require('body-parser');
// const { getContractId } = require('./functions')
const Contract = require('./cruds/contracts');
const Jobs = require('./cruds/jobs');
const Profiles = require('./cruds/profiles');
const { getProfile, getIsADm } = require('./middleware/getProfile')
const app = express();

app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

/**
 * FIX ME!
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
    Contract.getContractId({ ...returnParameters(req, { params: true }) }, (data, error) => {
        send(data, error, res)
    })
})
app.get('/contracts', getProfile, async (req, res) => {
    Contract.getContractsList({ ...returnParameters(req, {}) }, (data, error) => {
        send(data, error, res)
    })
})
app.get('/jobs/unpaid', getProfile, async (req, res) => {
    Jobs.getJobsUnpaid({ ...returnParameters(req, {}) }, (data, error) => {
        send(data, error, res)
    })
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    Jobs.postJobsPay({ ...returnParameters(req, { params: true }) }, (data, error) => {
        send(data, error, res)
    })
})

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
    Profiles.postBalanceDeposit({ ...returnParameters(req, { params: true, body: true }) }, (data, error) => {
        send(data, error, res)
    })
})

app.get('/admin/best-profession', getIsADm, async (req, res) => {
    Profiles.getBestProffesion({ ...returnParameters(req, { query: true }) }, (data, error) => {
        send(data, error, res)
    })
})

app.get('/admin/best-clients', getIsADm, async (req, res) => {
    Profiles.getBestClients({ ...returnParameters(req, { query: true }) }, (data, error) => {
        send(data, error, res)
    })
})


function returnParameters(req, rules = {}) {
    let ret = {};
    ret.app = req.app;
    ret.profile = req.profile;
    if (rules.query) {
        ret = { ...ret, ...req.query };
    }
    if (rules.body) {
        ret = { ...ret, ...req.body };
    }
    if (rules.params) {
        ret = { ...ret, ...req.params };
    }
    return ret;
}
function send(data, error, res) {
    if (error) {
        let { msg, code, ...errorOthers } = error;
        if (msg && code) {
            res.status(code).send({ msg, ...errorOthers });
        } else {
            res.status(500).send({ msg: "Internal error", ...error });
        }
    } else {
        res.send(data);
    };
}

module.exports = app;
