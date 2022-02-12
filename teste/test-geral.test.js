require("isomorphic-fetch");
import "babel-polyfill"
import Cloud from "./Cloud"
jest.setTimeout(5000);
test('contracts/1-get', (done) => {
  Cloud.get("contracts/1", {}, { profile_id: 1 }, (data, error) => {
    console.log(data)
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
      expect(error);
      done()
    } catch (error) {
      done(error)
    }
  })
});
