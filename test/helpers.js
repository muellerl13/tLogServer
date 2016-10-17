/**
 * Created by salho on 13.10.16.
 */
import User from '../app/models/user.model';
import chai from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

export const createTestUser = () => {
  let user = new User();
  user.local.username = "johnny";
  user.local.password = user.generateHash("topsecret");
  user.local.email = "jd@test.com";
  user.roles = ['admin','user'];
  return user.save();
};

export const login = (server,username,password) => chai.request(server)
  .post('/api/auth/login')
  .set('content-type','application/`x-www-form-urlencoded')
  .type('form')
  .send(`username=${username}`)
  .send(`password=${password}`);


