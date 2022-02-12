
const getProfile = async (req, res, next) => {
    const { Profile } = req.app.get('models')
    const profile = await Profile.findOne({ where: { id: req.headers.profile_id || 0 } })
    if (!profile) return res.status(401).end()
    req.profile = profile;
    next();
}

const getIsADm = async (req, res, next) => {
    //There shoould be some testing here if the user making the request is a ADM, a JWT token in the header that decrypted would look something like this:
    let obj = { id: 1, permissions: { adm: true } };
    if (obj && obj.permissions && obj.permissions.adm === true) {
        next();
    } else {
        return res.status(401).end()
    }
}

module.exports = { getIsADm, getProfile }