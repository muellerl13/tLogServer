/**
 * Created by salho on 13.10.16.
 */
'use strict';

// import the `mongoose` helper utilities
let utils = require('./utils');
import chai from 'chai';
let should = chai.should();
import chaiHttp from 'chai-http';
import {port} from '../server.conf';
import {createTestUser, login} from './helpers';

import POI from '../app/models/poi.model';

chai.use(chaiHttp);

let serverPort = port;

let serverInfo = {
  address: () => {
    return {address: '127.0.0.1', port: serverPort}
  }
};

/**
 * creates on single POI identified by nr
 * @param nr identifier of the POI
 * @param user creator of the POI
 * @returns A promise for the saved POI
 */
const createSamplePOI = (nr,user) => new POI({
  name: `POI ${nr}`,
  description: `Description ${nr}`,
  loc: {coordinates: [nr,nr]},
  creator: user._id
}).save();

/**
 * Creates a series of POIs
 * @param nr number of POIs that should be created
 * @param user creator of the POIs
 * @returns A promise for an array of all created POIs
 */
const createSamplePOIs =(nr,user) =>
  Array.from(Array(nr).keys())
    .reduce((promise,number) => promise.then(()=>createSamplePOI(number+1,user)),Promise.resolve([]))

const fakeOwner = {
      username: "poiowner",
      password: "topsecret",
      email: "po@test.com",
      roles: ["user"]
}

describe('POI API', ()=> {

  it('should allow to create new POI if we are logged in', done => {
    createTestUser()
      .then(user => login(serverInfo, 'johnny', 'topsecret'))
      .then(res => chai.request(serverInfo)
        .post('/api/poi')
        .set('authorization', `Bearer ${res.body.token}`)
        .send({
          name: "A POI",
          description: "A POI description",
          loc: {coordinates: [13.5, 45.2]}
        })
      )
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        should.exist(poi._id);
        poi.creator.local.username.should.equal("johnny");
        should.not.exist(poi.creator.local.password);
        done();
      })
      .catch(done);
  });

  it('should not allow to create new POI if we are not logged in', done => {
    chai.request(serverInfo)
      .post('/api/poi')
      .send({
        name: "A POI",
        description: "A POI description",
        loc: {coordinates: [13.5, 45.2]}
      })
      .then(res => {
        done(new Error("This should not work!!"));
      })
      .catch(err => {
        err.response.should.have.status(401);
        done();
      });
  });

  it("should list the latest ten entries", (done) => {
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then(()=>login(serverInfo, 'johnny', 'topsecret'))
      .then(res =>
        chai.request(serverInfo)
          .get('/api/poi')
          .set('authorization', `Bearer ${res.body.token}`))
      .then(res => {
        res.should.have.status(200);
        res.body.should.have.length(10);
        const pois = res.body;
        pois.forEach((poi,index) =>
          poi.name.should.be.equal("POI " + (12 - index))
        );
        done()
      })
      .catch(done)
  });

  it("should support pagination", (done) => {
    let token = null;
    const getPage = (page, size, numberOfPois,resultLength,token) =>
        chai.request(serverInfo)
          .get(`/api/poi?size=${size}&page=${page}`)
          .set('authorization', `Bearer ${token}`)
          .then(res => {
            res.should.have.status(200);
            const pois = res.body;
            pois.should.have.length(resultLength);
            pois.forEach((poi,index)=>
              poi.name.should.equal(`POI ${numberOfPois - index}`)
            );
            return Promise.resolve();
          }).catch(err=>Promise.reject(err))
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then(pois => login(serverInfo, 'johnny', 'topsecret'))
      .then((res) => {
        token = res.body.token;
        return getPage(0, 8, 12, 8, token);
      })
      .then(() => getPage(1, 8, 4, 4, token))
      .then(()=>done())
      .catch(done);
  });

  it("should be possible to load a single POI by its id", done => {
    let poiToList = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then((poi)=>{
        poiToList = poi;
        return login(serverInfo, 'johnny', 'topsecret')
      })
      .then(res =>
        chai.request(serverInfo)
          .get(`/api/poi/${poiToList._id}`)
          .set('authorization', `Bearer ${res.body.token}`))
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        poi.name.should.be.equal("POI 12");
        poi.description.should.be.equal("Description 12");
        should.exist(poi._id);
        poi.loc.coordinates.should.be.an('array').and.have.lengthOf(2);
        poi.loc.coordinates[0].should.be.equal(12).and.be.a.Number;
        poi.loc.coordinates[1].should.be.equal(12).and.be.a.Number;
        should.exist(poi.creator);
        poi.creator.local.username.should.be.equal("johnny");
        done()
      }).catch(done);
  });

  it("should produce an error, if the POI does not exist", done => {
    chai.request(serverInfo)
      .get(`/api/poi/42`)
      .then(()=>done(new Error("It should be impossible to read a POI that does not exit!")))
      .catch((err) => {
        err.response.should.have.status(400);
        err.response.body.message.should.be.equal('This POI could not be found');
        done();
      })
    });

  it("should reject the query for a single POI if the user is not logged in", done => {
    let poiToList = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then(poi =>
        chai.request(serverInfo)
          .get(`/api/poi/${poi._id}`))
      .then(res =>
        done(new Error("This should not be allowed!"))
      ).catch((err) => {
        err.response.should.have.status(401);
        done()
      })
  });

  it("should be possible to update a single POI ", done => {
    let poiToList = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then((poi)=>{
        poiToList = poi;
        return login(serverInfo, 'johnny', 'topsecret')
      })
      .then(res =>
        chai.request(serverInfo)
          .patch(`/api/poi/${poiToList._id}`)
          .set('authorization', `Bearer ${res.body.token}`)
          .send({name: "POI Updated"}))
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        poi.name.should.be.equal("POI Updated");
        poi.description.should.be.equal("Description 12");
        should.exist(poi._id);
        poi.loc.coordinates.should.be.an('array').and.have.lengthOf(2);
        poi.loc.coordinates[0].should.be.equal(12).and.be.a.Number;
        poi.loc.coordinates[1].should.be.equal(12).and.be.a.Number;
        should.exist(poi.creator);
        poi.creator.local.username.should.be.equal("johnny");
        done()
      }).catch(done);
  });

  it("should not be possible to update a single POI if the current user is not the creator", done => {
    let poiToList = null;
    createTestUser(fakeOwner)
      .then(() => createTestUser())
      .then(user => createSamplePOIs(12,user))
      .then((poi)=>{
        poiToList = poi;
        return login(serverInfo, fakeOwner.username, fakeOwner.password)
      })
      .then(res =>
        chai.request(serverInfo)
          .patch(`/api/poi/${poiToList._id}`)
          .set('authorization', `Bearer ${res.body.token}`)
          .send({name: "POI Updated"}))
      .then(res => {
        done(new Error("This should not be allowed!"));
      }).catch((err) => {
        err.should.have.status(401);
        err.response.body.message.should.be.equal("You are not allowed to change somebody else's POI");
        done();
    });
  });

  it("should be possible to delete a poi, if you are the creator or an admin", done => {
    let poiToDelete = null;
    createTestUser()
      .then(user => createSamplePOIs(12,user))
      .then((poi)=>{
        poiToDelete = poi;
        return login(serverInfo, 'johnny', 'topsecret')
      })
      .then(res =>
        chai.request(serverInfo)
          .delete(`/api/poi/${poiToDelete._id}`)
          .set('authorization', `Bearer ${res.body.token}`))
      .then(res => {
        res.should.have.status(200);
        let poi = res.body;
        poi.name.should.be.equal("POI 12");
        poi.description.should.be.equal("Description 12");
        should.exist(poi._id);
        poi.loc.coordinates.should.be.an('array').and.have.lengthOf(2);
        poi.loc.coordinates[0].should.be.equal(12).and.be.a.Number;
        poi.loc.coordinates[1].should.be.equal(12).and.be.a.Number;
        should.exist(poi.creator);
        poi.creator.local.username.should.be.equal("johnny");
        return POI.findOne({_id: poi._id})
      })
      .then(poi => (poi === null) ? done() : done(new Error("POI was not deleted!")))
      .catch(done);
  });

  it("should NOT be possible to delete a poi, if you are neither the creator nor an admin", done => {
    let poiToDelete = null;
    createTestUser(fakeOwner)
      .then(() => createTestUser())
      .then(user => createSamplePOIs(12,user))
      .then((poi)=>{
        poiToDelete = poi;
        return login(serverInfo, fakeOwner.username, fakeOwner.password)
      })
      .then(res =>
        chai.request(serverInfo)
          .delete(`/api/poi/${poiToDelete._id}`)
          .set('authorization', `Bearer ${res.body.token}`)
          .send({name: "POI Updated"}))
      .then(res => {
        done(new Error("This should not be allowed!"));
      }).catch((err) => {
      err.should.have.status(401);
      err.response.body.message.should.be.equal("You are not allowed to change somebody else's POI");
      done();
    });
  });


});

