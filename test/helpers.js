/**
 * Created by salho on 13.10.16.
 */
import User from '../app/models/user.model';
import chai from 'chai';
import chaiHttp from 'chai-http';

chai.use(chaiHttp);

const defaultUser = {
  username: "johnny",
  password: "topsecret",
  email: "jd@test.com",
  roles: ['admin','user']
}

export const createTestUser = (newUser = defaultUser) => {
  let user = new User();
  user.local.username = newUser.username;
  user.local.password = user.generateHash(newUser.password);
  user.local.email = newUser.email;
  user.roles = newUser.roles;
  return user.save();
};

export const login = (server,username,password) => chai.request(server)
  .post('/api/auth/login')
  .set('content-type','application/`x-www-form-urlencoded')
  .type('form')
  .send(`username=${username}`)
  .send(`password=${password}`);


