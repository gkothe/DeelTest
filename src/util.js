
let debugdata = false;
const moment = require("moment-timezone");
const dollarUSLocale = Intl.NumberFormat('en-US', {
    style: "currency",
    currency: "USD",
});

module.exports = {
    dollarUSLocale,
    validateFields(objs) {
        for (const [key, obj] of Object.entries(objs)) {
            var error = { errorMsg: obj.msg ? obj.msg : "Field: " + (obj.nome ? obj.nome : key) + ". Value: " + (!obj.value ? "Not defined" : obj.value) + ". Invalid value" }
            if (debugdata) {
                console.log(key, obj);
            }
            if (obj.type == "int") {
                if (!obj.required && (obj.value === "" || obj.value === null || obj.value === undefined)) {
                    obj.value = null;
                } else if (obj.required && (obj.value === "" || obj.value === null || obj.value === undefined)) {
                    return error;
                } else if (parseInteger(obj.value, true) === false) {
                    return error;
                } else {
                    obj.value = parseInteger(obj.value, true);
                    if (obj.naoAceitaZero && obj.value == 0) {
                        return error;
                    }
                }
            }

            if (obj.type == "date") {
                if (obj.required && (!obj.value)) {
                    return error;
                }
                if ((obj.value) && !moment(obj.value).isValid()) {
                    return error;
                }
            }

            if (obj.type == "float") {
                if (!obj.required && (obj.value === "" || obj.value === undefined || obj.value === null)) {
                    obj.value = null;
                    continue;
                }
                if (obj.required && (obj.value === "" || obj.value === undefined || obj.value === null)) {
                    return error;
                }
                if ((isNaN(obj.value))) {
                    return error;
                }

            }
            if (obj.type == "flagtxt") {
                if (!obj.valid) {
                    return { error: "Valid values not informed." }
                }

                if (!obj.required && (obj.value === "" || obj.value === null || obj.value === undefined)) {
                    obj.value = null;
                    continue;
                }

                if (obj.required && (obj.value === "" || obj.value === null || obj.value === undefined)) {
                    return error;
                }
                if (!obj.valid.includes(obj.value)) {
                    return error;
                }

            }
            if (obj.type == "bool") {
                if (obj.value === null || obj.value === undefined) {
                    obj.value = false;
                }
                if (obj.value !== true && obj.value !== false) {
                    return error;
                }
            }
            if (obj.type == "json") {
                if (obj.required && (obj.value === "" || obj.value === undefined || obj.value === null)) {
                    return error;
                }
                if (obj.value === undefined || obj.value === null) {
                    continue;
                }
                try {
                    obj.value = JSON.parse(JSON.stringify(obj.value))
                } catch (error) {
                    return error;
                }
                if (obj.value.constructor != Object) {
                    return error;
                }

            }
            if (obj.type == "array") {
                if (obj.required && (obj.value === "" || obj.value === undefined || obj.value === null)) {
                    return error;
                }

                if (obj.value === undefined || obj.value === null) {
                    continue;
                }

                if (obj.value.constructor != Array) {
                    return error;
                }
            }
            if (obj.type == "text") {
                if (obj.required && (obj.value === "" || obj.value === undefined || obj.value === null)) {
                    return error;
                }
            }
        }

        var ret = {}
        for (const [key, obj] of Object.entries(objs)) {
            ret[key] = obj.value;
        }
        return ret;
    }
}
function parseInteger(string, forceThrow) {
    if (!string || string === "") {
        return 0;
    }
    try {
        var v = parseInt(string + "");
        if (isNaN(v) && forceThrow) {
            return false;
        }
        if (!v) {
            v = 0;
        }
        return v;
    } catch (e) {
        if (forceThrow) {
            return false;
        } else {
            return 0;
        }
    }
};