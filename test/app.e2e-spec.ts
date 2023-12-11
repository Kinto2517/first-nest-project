import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module"
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { after } from "node:test";
import { PrismaService } from "../src/prisma/prisma.service";
import * as pactum from 'pactum';
import { AuthDto } from "../src/auth/dto";
import { EditUserDto } from "user/dto";
import { CreateBookmarkDto } from "bookmark/dto";

describe('App e2e', () => {

  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef =
      await Test.createTestingModule({
        imports: [AppModule],
      }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }))

    await app.init();
    await app.listen(3334);

    prisma = app.get(PrismaService);
    await prisma.cleanDb();

    pactum.request.setBaseUrl('http://localhost:3334');
  });

  afterAll(() => {
    app.close();
  }
  );


  describe('Auth', () => {
    describe('Sign up', () => {

      it('should throw an error if email is not valid', () => {
        const dto: AuthDto = {
          email: 'ersgmail.com',
          password: '123456',
        }
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(400)
      });

      it('should create a new user', () => {
        const dto: AuthDto = {
          email: 'ers@gmail.com',
          password: '123456',
        }
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      });
      describe('Sign in', () => {
        it('should return a token', () => {
          const dto: AuthDto = {
            email: 'ers@gmail.com',
            password: '123456',
          }
          return pactum
            .spec()
            .post('/auth/signin')
            .withBody(dto)
            .expectStatus(200)
            .stores('userAt', 'access_token');
        });
      });
    });
  });

  describe('User', () => {
    describe('Get user', () => {
      it('should return a user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)

      })

    });
    describe('Update user', () => {
      it('should update a user', () => {

        const dto: EditUserDto = {
          firstName: 'Ers',
          lastName: 'K',
          email: 'hey123@gmail.com'
        }

        return pactum
          .spec()
          .patch('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName)
          .expectBodyContains(dto.email)
      })
    });

  });

  describe('Bookmarks', () => {


    describe('Get all empty bookmarks', () => {
      it('should return bookmark', () => {

        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
      })

    });

    describe('Create bookmark', () => {
      const dto: CreateBookmarkDto = {
        title: 'Google',
        description: 'Search engine',
        link: 'https://google.com'
      } 
      it('should create a bookmark', () => {
        
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', 'id')
      })
    });

    describe('Get one bookmark by id', () => {
      it('should return a bookmark', () => {
        
        return pactum
        .spec()
        .get('/bookmarks/{id}')
        .withPathParams('id', '$S{bookmarkId}')
        .withHeaders({
          Authorization: 'Bearer $S{userAt}'
        })
        .expectStatus(200)
        .inspect();

      })
    });

    describe('Update bookmark', () => {

    });
    describe('Delete bookmark', () => {

    });
  });


});