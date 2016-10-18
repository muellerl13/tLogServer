/**
 * Created by salho on 17.10.16.
 */
'use strict';

// import the `mongoose` helper utilities
let utils = require('./utils');
import chai from 'chai';
let should = chai.should();
import chaiHttp from 'chai-http';
import {port} from '../server.conf';
import {createTestUser, login, createSamplePOIs, createSampleTrips, standardUser, adminUser} from './helpers';

import POI from '../app/models/poi.model';

chai.use(chaiHttp);

let serverPort = port;

let serverInfo = {
  address: () => {
    return {address: '127.0.0.1', port: serverPort}
  }
};

describe("Trip API", () => {

  const testTrip = {
    name: "A Test Trip",
    description: "A Trip Description"
  }

  it('should allow to create new Trip if we are logged in', done => {
    createTestUser()
      .then(user => {
        testTrip.creator = user._id;
        return login(serverInfo, adminUser.username, adminUser.password)
      })
      .then(res => chai.request(serverInfo)
        .post('/api/trip')
        .set('authorization', `Bearer ${res.body.token}`)
        .send(testTrip)
      )
      .then(res => {
        res.should.have.status(200);
        let trip = res.body;
        should.exist(trip._id);
        trip.creator.local.username.should.equal("johnny");
        should.not.exist(trip.creator.local.password);
        should.exist(trip.createdAt);
        trip.name.should.be.equal(testTrip.name);
        trip.description.should.be.equal(testTrip.description);
        trip.pois.should.be.an("array");
        trip.pois.should.be.empty;
        done();
      })
      .catch(done);
  });

  it('should not allow to create new Trip if we are not logged in', done => {
    chai.request(serverInfo)
      .post('/api/trip')
      .send(testTrip)
      .then(res => {
        done(new Error("This should not work!!"));
      })
      .catch(err => {
        err.response.should.have.status(401);
        done();
      });
  });

  it("should retrieve a list of the first ten most current trips", done => {
    createTestUser()
      .then(user => createSampleTrips(15, user))
      .then(trips => login(serverInfo, adminUser.username, adminUser.password))
      .then(res => chai.request(serverInfo)
        .get('/api/trip')
        .set('authorization', `Bearer ${res.body.token}`)
      )
      .then(res => {
        let trips = res.body;
        trips.should.have.a.lengthOf(10);
        trips[0].name.should.be.equal("Trip 15");
        trips[9].name.should.be.equal("Trip 6");
        done();
      }).catch(done);
  });

  it("should support pagination", done => {
    const getPage = (page, size, first, last, length, token) => {
      chai.request(serverInfo)
        .get(`/api/trip?page=${page}&size=${size}`)
        .set('authorization', `Bearer ${token}`)
        .then(res => {
          should.not.exist(err);
          let trips = res.body;
          trips.should.have.a.lengthOf(length);
          trips[0].name.should.be.equal("Trip " + first);
          trips[length - 1].name.should.be.equal("Trip " + last);
          return Promise.resolve(token);
        })
    };
    createTestUser()
      .then(user => createSampleTrips(15, user))
      .then(trips => login(serverInfo, adminUser.username, adminUser.password))
      .then(res=>getPage(0, 5, 15, 11, 5,res.body.token))
      .then(token=>getPage(1, 5, 10, 6, 5,token))
      .then(token=>getPage(2, 5, 5, 1, 5,token))
      .then(()=>done())
      .catch(done);
  });

  it("should return the requested trip along with its pois", done => {
    let tripToLoad = null;
    createTestUser()
      .then(user => createSampleTrips(3, user))
      .then(trips => {tripToLoad = trips[1]; return login(serverInfo, adminUser.username, adminUser.password)})
      .then(res => chai.request(serverInfo)
        .get(`/api/trip/${tripToLoad._id}`)
        .set('authorization', `Bearer ${res.body.token}`)
      )
      .then(res => {
        res.should.have.status(200);
        let trip = res.body;
        trip.name.should.be.equal(tripToLoad.name);
        trip.description.should.be.equal(tripToLoad.description);
        trip._id.should.be.equal(tripToLoad._id.toString());
        trip.pois.should.be.an('array');
        trip.pois.should.have.lengthOf(5);
        trip.pois.forEach((poi,index) => {
          poi.name.should.be.equal(`${trip.name} - POI ${index+1}`)
        });
        done();
      })
      .catch(done);
  });

  it("should only load those trips created by the current user sorted by creation date descending", done => {
    createTestUser()
      .then(admin => createSampleTrips(8,admin))
      .then(() => createTestUser(standardUser))
      .then(user => createSampleTrips(5,user))
      .then(()=>login(serverInfo, standardUser.username, standardUser.password))
      .then(res => chai.request(serverInfo)
        .get('/api/trip/mine')
        .set('authorization', `Bearer ${res.body.token}`)
      )
      .then(res => {
        let trips = res.body;
        trips.should.have.a.lengthOf(5);
        trips.forEach((trip,index) => {
          trip.creator.local.username.should.be.equal(standardUser.username);
          trip.name.should.be.equal(`Trip ${5 - index}`);
        });
        done();
      }).catch(done);
  });

  it("should create a new POI and add it to an existing trip", done => {
    let tripToAddPOI = null;
    createTestUser(standardUser)
      .then(user => createSampleTrips(2,user))
      .then(trips =>{ tripToAddPOI = trips[1]; return login(serverInfo, standardUser.username, standardUser.password)})
      .then(res => chai.request(serverInfo)
        .post(`/api/trip/addpoi/${tripToAddPOI._id}`)
        .set('authorization', `Bearer ${res.body.token}`)
        .send({
          name: "My POI",
          description: "Supi!",
          loc: {
            type: "Point",
            coordinates: [45, 15]
          }})
      )
      .then(res => {
        let trip = res.body;
        trip.name.should.be.equal(tripToAddPOI.name);
        trip.pois.should.have.length(6);
        let latestPOI = trip.pois.pop();
        latestPOI.name.should.be.equal("My POI");
        latestPOI.description.should.be.equal("Supi!");
        done();
      })
      .catch(done)
  });

  it("should not allow for adding new POI to somebody else's trip", done => {
    let tripToAddPOI = null;
    createTestUser(standardUser)
      .then(()=>createTestUser(adminUser))
      .then(user => createSampleTrips(2,user))
      .then(trips =>{ tripToAddPOI = trips[1]; return login(serverInfo, standardUser.username, standardUser.password)})
      .then(res => chai.request(serverInfo)
        .post(`/api/trip/addpoi/${tripToAddPOI._id}`)
        .set('authorization', `Bearer ${res.body.token}`)
        .send({
          name: "My POI",
          description: "Supi!",
          loc: {
            type: "Point",
            coordinates: [45, 15]
          }})
      )
      .then(res => done(new Error("It should not be possible to add a poi to another user's trip")))
      .catch((err) =>{
        err.should.have.status(401);
        done();
      })
  });

});
