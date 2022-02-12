import fetch from 'node-fetch';
const host = "http://192.168.1.102:3001";
module.exports = {
  getHost() {
    return host;
  },
  setUpHeaders(headers) {
    return {
      Accept: "application/json",
      "Content-Type": "application/json",
      // "x-request-id": "0d7366a14e0f0fd2df0161c691779983",
      ...headers
    }
  },
  post(metodo, data, headers, retorno) {
    var url = host + "/" + metodo;
    var config = {
      method: "POST",
      headers: this.setUpHeaders(headers),
      body: JSON.stringify(data)
    };

    this.onFetch(url, config, retorno);
  },
  get(metodo, data, headers, retorno) {
    var url = host + "/" + metodo;
    // var url = metodo;
    url = this.treatQuery(url, data)
    var config = {
      method: "GET",
      headers: this.setUpHeaders(headers),
    };
    this.onFetch(url, config, retorno);
  },
  put(metodo, data, headers, retorno) {
    var url = host + "/" + metodo;
    var config = {
      method: "PUT",
      headers: this.setUpHeaders(headers),
      body: JSON.stringify(data)
    };
    this.onFetch(url, config, retorno);
  },
  delete(metodo, data, headers, retorno) {
    var url = host + "/" + metodo;
    var config = {
      method: "DELETE",
      headers: this.setUpHeaders(headers),
      body: JSON.stringify(data)
    };

    this.onFetch(url, config, retorno);
  },
  onFetch(url = "", config = {}, callback) {
    fetch(url, config)
      .then(response => {
        this.onResolverResponse(response, (sucess, error) => {
          if (error) { console.log(error); }
          callback(sucess, error);
        });
      })
      .catch(error => {
        callback(undefined, error);
      });
  },
  onResolverResponse(response, callback) {
    if (!response || !response.json) return retorno(undefined, { msg: "not JSON" });
    var p1 = response.json();
    p1.then((responseData, error) => {
      if (response.status != 200) {
        callback(undefined, responseData);
      } else if (error) {
        callback(undefined, error);
      } else {
        callback(responseData);
      }
    });
  },
  isObject(val) {
    return typeof val === "object";
  },
  isArray(object) {
    if (object && JSON.stringify(object) == "[]") {
      return true;
    }
    if (object && object.constructor && object.constructor === Array) {
      return true;
    } else {
      return false;
    }
  },
  treatQuery(url, data) {
    url += "?";
    var lista = Object.keys(data);
    for (var i = 0; i < lista.length; i++) {
      var item = lista[i];
      if (i != 0) {
        url += "&";
      }
      url += "" + item + "=" + (this.isObject(data[item]) || this.isArray(data[item]) ? JSON.stringify(data[item]) : encodeURI(data[item]));
    }
    return url
  }

};
