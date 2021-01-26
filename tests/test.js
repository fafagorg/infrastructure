const assert = require('assert');
const chai = require('chai');
const chaiHttp = require('chai-http');
const { exec } = require("child_process");
chai.use(chaiHttp);

//const Influx = require('influx');
//const influx = new Influx.InfluxDB('http://localhost:8086/metrics')

// To reject expired TLS certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const authURL = "http://localhost:8081/api/v1";
const productsURL = "http://localhost:8082/api/v1";
const reviewsURL = "http://localhost:8083/api/v1";
const messengerURL = "http://localhost:8084/api/v1";

const testID = 28;

// Generated variables
let productID;
let token;

let testUser = {
  "username": "testUser" + testID,
  "password": "testPass",
  "name": "testName",
  "surname": "testSurname",
  "phone": "612345678",
  "email": "testEmail@test.test"
}

let testUserReviewer = {
  "username": "reviewer" + testID,
  "password": "testPass",
  "name": "reviewer",
  "surname": "testSurname",
  "phone": "612345678",
  "email": "testEmail2@test.test"
}

let testProduct = {
  "name": "testProduct" + testID,
  "category": "testCategory",
  "price": "999",
  "seller": testUser.username,
  "id": testID
}

let testReview = {
  "title": "testTitle"+ testID,
  "score": "1",
  "description": "testDescription",
  "reviewerClientId": testUserReviewer.username,
  "reviewedProductId": productID,
  "reviewedClientId": testUser.username
}






/*before((done) => {
  // Docker-compose up -d
  console.log('---------- Start E2E infrastructure ----------');
  exec("docker-compose -f tests/docker-compose-e2e.yaml pull", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      done(error);
    } else if (stderr) {
      console.log(`stderr: ${stderr}`);
    } else {
      console.log(`stdout: ${stdout}`);
    }
    exec("docker-compose -f tests/docker-compose-e2e.yaml up -d", (error1, stdout1, stderr1) => {
      if (error1) {
        console.log(`error: ${error1.message}`);
        done(error1);
      } else if (stderr) {
        console.log(`stderr: ${stderr1}`);
      } else {
        console.log(`stdout: ${stdout1}`);
      }

      // Delete and check the agreement does not exist already
      setTimeout(() => {
        /*chai.request(registryURL)
          .delete("/agreements/" + testAgreement.id)
          .then(response => {
            chai.request(registryURL)
              .get("/agreements/" + testAgreement.id)
              .then(response => {
                // Check the agreement does not exist
                assert.strictEqual(response.status, 404, 'The agreement should not exist at the beginning');
                done();
              }).catch(err => {
                done(err);
              });
          }).catch(err => {
            done(err);
          })
        done();
      }, 10000);
    });
  });
});*/

describe('Register user, create product, create review, get profile: ', () => {
  it('should successfully create an user, verify it exists and get a token', (done) => {
    // Register User
    chai.request(authURL)
      .post("/auth/register")
      .send(testUser)
      .then(response => {
        // Check the response is successful
        assert.strictEqual(response.status, 201, 'The user register must be successful');

        // GET User
        chai.request(authURL)
          .get("/users/" + testUser.username)
          .then(response => {
            // Check the response is successful
            assert.strictEqual(response.status, 200, 'The user should exist');

            // Remove inserted mongodb values to compare
            const fetchedUser = { ...response.body };
            delete fetchedUser._id;
            delete fetchedUser.__v;

            const toCompare = { ...testUser };
            delete toCompare.password;

            assert.deepStrictEqual(fetchedUser, toCompare, 'The user created should match the testUser.');

            const loginObject = { username: testUser.username, password: testUser.password }
            chai.request(authURL)
              .post("/auth/login")
              .send(loginObject)
              .then(response => {
                // Store and check token
                token = response.body.token;
                assert.notStrictEqual(token, '', 'The token should not be empty');
                assert.notStrictEqual(token, undefined, 'The token should not be undefined');

                done();
              }).catch(err => {
                console.log(err);
                done(err);
              });
          }).catch(err => {
            console.log(err);
            done(err);
          });
      }).catch(err => {
        done(err);
      });
  });

  it('should successfully create a product, and verify it exists', (done) => {
    // Create product
    chai.request(productsURL)
      .post("/products")
      .set('Authorization', 'Bearer ' + token)
      .send(testProduct)
      .then(response => {
        // Check the response is successful
        assert.strictEqual(response.status, 201, 'The product creation must be successful');

        // GET product
        chai.request(productsURL)
          .get("/products")
          .then(response => {
            // Check the response is successful
            assert.strictEqual(response.status, 200, 'Should respond a 200');

            let fetchedProduct;
            // Find Product 
            for (const product of response.body) {
              if (product.name === testProduct.name) {
                fetchedProduct = product;
                break;
              }
            }
            assert.notStrictEqual(undefined, fetchedProduct, "Couldn't find the inserted product.");

            productID = fetchedProduct.id;

            // Delete autogenerated parameters for comparison
            delete fetchedProduct._id;
            delete fetchedProduct.__v;
            delete fetchedProduct.id;
            const productToCompare = { ...testProduct }
            delete productToCompare.id;

            // Comparison
            assert.deepStrictEqual(fetchedProduct, productToCompare, 'The product created should match the testProduct.');

            done();
          }).catch(err => {
            console.log(err);
            done(err);
          });
      }).catch(err => {
        done(err);
      });
  });

  /*it('should successfully create a review, and verify it exists', (done) => {
    // Register User
    chai.request(authURL)
      .post("/auth/register")
      .send(testUserReviewer)
      .then(response => {
        // Create review using the previously created product, testUser and reviewer
        chai.request(reviewsURL)
          .post("/reviews")
          .set('Authorization', token)
          .send(testReview)
          .then(response => {
            // Check the response is successful
            assert.strictEqual(response.status, 201, 'The review creation must be successful');

            // GET reviews
            chai.request(reviewsURL)
              .get("/reviews")
              .then(response => {
                // Check the response is successful
                assert.strictEqual(response.status, 200, 'Should respond a 200');

                let fetchedReview;
                // Find Product 
                for (const review of response.body) {
                  if (review.title === testReview.title) {
                    fetchedReview = review;
                    break;
                  }
                }
                assert.notStrictEqual(undefined, fetchedReview, "Couldn't find the inserted product.");

                delete fetchedReview._id;
                delete fetchedReview.__v;
                delete fetchedReview.id;

                //const reviewToCompare = { ...testReview }

                assert.deepStrictEqual(fetchedReview, testReview, 'The product created should match the testProduct.');

                done();
              }).catch(err => {
                console.log(err);
                done(err);
              });
          }).catch(err => {
            done(err);
          });

      });


  });*/

  /*it('should compute agreement periods', (done) => {
    // Send to update points
    chai.request(reporterURL)
      .post('/contracts/' + testAgreement.id + '/createPointsFromPeriods')
      .send({ periods: [{ from: "2020-04-27T00:00:00Z", to: "2020-04-27T23:59:00Z" }] })
      .then(response => {
        // Check the response is successful
        assert.strictEqual(response.status, 200, 'The points creation must end successful');
        // Database check
        setTimeout(() => {
          influx.queryRaw('SELECT "guaranteeValue" FROM "autogen"."metrics_values" WHERE "agreement" = \'' + testAgreement.id + '\'').then(result => {
            assert.deepStrictEqual(result.results,
              [{ "statement_id": 0, "series": [{ "name": "metrics_values", "columns": ["time", "guaranteeValue"], "values": [["2020-04-27T00:00:00Z", 33.33333333333333]] }] }],
              'The data in influx must be correct');

            // Delete influx inserted points
            influx.queryRaw('DROP SERIES FROM "metrics_values" WHERE "agreement" = \'' + testAgreement.id + '\'').then(() => {
              // Check it was deleted
              influx.queryRaw('SELECT "guaranteeValue" FROM "autogen"."metrics_values" WHERE "agreement" = \'' + testAgreement.id + '\'').then(result2 => {
                assert.deepStrictEqual(result2, { "results": [{ "statement_id": 0 }] }, 'The data in influx must have been deleted');
                // End this test
                done();
              }).catch(err => {
                done(err);
              });
            }).catch(err => {
              done(err);
            });
          }).catch(err => {
            done(err);
          });
        }, 3000);
      }).catch(err => {
        done(err);
      });
  });

  it('should successfully delete the agreement', (done) => {
    // Send to update points
    chai.request(registryURL)
      .delete("/agreements/" + testAgreement.id)
      .then(response => {
        // Check the response is successful
        assert.strictEqual(response.status, 200, 'The DELETE request must be successful');

        // Registry check
        chai.request(registryURL)
          .get("/agreements/" + testAgreement.id)
          .then(response => {
            // Check the agreement does not exist
            assert.equal(response.status, 404, 'The agreement must no longer exist in the registry');
            done();
          }).catch(err => {
            done(err);
          });
      }).catch(err => {
        done(err);
      });
  });*/
});

/*after((done) => {
  // Docker-compose down
  console.log('---------- Stop E2E infrastructure ----------');
  exec("docker-compose -f tests/docker-compose-e2e.yaml down", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      done(error);
    } else if (stderr) {
      console.log(`stderr: ${stderr}`);
    } else {
      console.log(`stdout: ${stdout}`);
    }
    done();
  });
});*/