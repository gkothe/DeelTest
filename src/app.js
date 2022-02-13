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
    let dataClient = returnParameters(req, res, { params: true });
    if (dataClient) {
        Contract.getContractId(dataClient, (data, error) => {
            send(data, error, res)
        })
    }

})
app.get('/contracts', getProfile, async (req, res) => {
    let dataClient = returnParameters(req, res, {});
    if (dataClient) {
        Contract.getContractsList(dataClient, (data, error) => {
            send(data, error, res)
        })
    }
});

app.get('/jobs/unpaid', getProfile, async (req, res) => {
    let dataClient = returnParameters(req, res, {});
    if (dataClient) {
        Jobs.getJobsUnpaid(dataClient, (data, error) => {
            send(data, error, res)
        })
    }
})

app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
    let dataClient = returnParameters(req, res, { params: true });
    if (dataClient) {
        Jobs.postJobsPay(dataClient, (data, error) => {
            send(data, error, res)
        })
    }
})

app.post('/balances/deposit/:userId', getProfile, async (req, res) => {
    let dataClient = returnParameters(req, res, { params: true, body: true });
    if (dataClient) {
        Profiles.postBalanceDeposit(dataClient, (data, error) => {
            send(data, error, res)
        })
    }
})

app.get('/admin/best-profession', getIsADm, async (req, res) => {
    let dataClient = returnParameters(req, res, { query: true });
    if (dataClient) {
        Profiles.getBestProffesion(dataClient, (data, error) => {
            send(data, error, res)
        })
    }
})

app.get('/admin/best-clients', getIsADm, async (req, res) => {
    let dataClient = returnParameters(req, res, { query: true });
    if (dataClient) {
        Profiles.getBestClients(dataClient, (data, error) => {
            send(data, error, res)
        })
    }
})


function returnParameters(req, res, rules = {}) {
    let ret = {};

    let testForkeys = testeForReserverdKeys({ ...req.query, ...req.body, ...req.params });
    if (testForkeys.error) {
        res.status(401).send({ msg: testForkeys.msg });
        return false;
    }
    if (rules.query) {
        ret = { ...ret, ...req.query };
    }
    if (rules.body) {
        ret = { ...ret, ...req.body };
    }
    if (rules.params) {
        ret = { ...ret, ...req.params };
    }

    ret.app = req.app;
    ret.profile = req.profile;
    return ret;
}

function testeForReserverdKeys(param) {
    if (param.app) {
        return { error: true, msg: "The kay 'app' is reserverd. Dont send a parameter with this name." }
    }

    if (param.profile) {
        return { error: true, msg: "The kay 'profile' is reserverd. Dont send a parameter with this name." }
    }
    return { error: false };
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
