require("isomorphic-fetch");
import "babel-polyfill"
import Cloud from "./Cloud"
jest.setTimeout(5000);

//im assuming that every time that that tests would run the database would have been the same, every time. Else some tests that modifie the database may fail on a second/third/etc run.
//im actually not sure how test environments are organized in big companies. 


test('contracts/1-get', (done) => {
  Cloud.get("contracts/1", {}, { profile_id: 1 }, (data, error) => {
    console.log(data, error)
    try {
      expect(data.id).toBe(1);
      done()
    } catch (error) {
      done(error)
    }
  })
});
test('contracts/blabla-get', (done) => {
  Cloud.get("contracts/blabla", {}, { profile_id: 1 }, (data, error) => {
    console.log(data, error)
    try {
      expect(error).toBeDefined();
      done()
    } catch (error) {
      done(error)
    }
  })
});

test('contracts/list', (done) => {
  Cloud.get("contracts", {}, { profile_id: 4 }, (data, error) => {
    try {
      expect(data.some(({ status, ContractorId, ClientId }) => {
        return (ContractorId === 4 || ClientId === 4) && (status == "in_progress" || status == "new")
      })).toBe(true);
      done()
    } catch (error) {
      done(error)
    }
  })
});


test('jobs/unpaid', (done) => {
  Cloud.get("jobs/unpaid", {}, { profile_id: 2 }, (data, error) => {
    try {
      expect(data.some(({ paid, status, ContractorId, ClientId }) => {
        console.log(paid, status, ContractorId, ClientId)
        return (ContractorId === 2 || ClientId === 2) && (status == "in_progress") && paid == null;
      })).toBe(true);
      done()
    } catch (error) {
      done(error)
    }
  })
});


test('jobs/pay', (done) => {
  //must reset database to work.
  Cloud.post("jobs/5/pay", {}, { profile_id: 4 }, (data, error) => {
    console.log(data, error)
    try {
      expect(data.ok).toBeDefined();
      done()
    } catch (error) {
      done(error)
    }
  })
});


test('balances/deposit/2-post', (done) => {

  Cloud.post("balances/deposit/2", { deposit_value: 50 }, { profile_id: 2 }, (data, error) => {
    console.log(data, error)
    try {
      expect(data.ok).toBeDefined();
      done()
    } catch (error) {
      done(error)
    }
  })
});


test('admin/best-profession-get', (done) => {
  let param = {
    start: '2020-08-15T00:00:00.000Z',
    end: '2020-08-22T23:59:59.000Z',
    profile: 'a'
  };
  Cloud.get("admin/best-profession", param, {}, (data, error) => {
    console.log(data, error)
    try {
      expect(data.total).toBeDefined();
      done()
    } catch (error) {
      done(error)
    }
  })
});


test('admin/best-clients-get', (done) => {

  let param = {
    start: '2020-08-15T00:00:00.000Z',
    end: '2020-08-22T23:59:59.000Z',
    limit: 5,
    app: 'a'
  };
  Cloud.get("admin/best-clients", param, {}, (data, error) => {
    console.log(data, error)
    try {
      expect(data.some(({ total }) => {
        return (total > 0);
      })).toBe(true);
      done()
    } catch (error) {
      done(error)
    }
  })
});