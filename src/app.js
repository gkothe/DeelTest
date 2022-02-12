const { sequelize } = require('./model')
const express = require('express');
const bodyParser = require('body-parser');
// const { getContractId } = require('./functions')
const Contract = require('./cruds/contract');
const { getProfile } = require('./middleware/getProfile')
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
    Contract.getContractId({ ...returnParameters(req, { params: true }) }, (data, error) => {
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
        res.status(code).send({ msg, ...errorOthers });
    } else {
        res.send(data);
    };
}

module.exports = app;
