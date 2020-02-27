# NestJS Objection

<a href="https://www.npmjs.com/package/nestjs-objection"><img src="https://img.shields.io/npm/v/nestjs-objection.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/package/nestjs-objection"><img src="https://img.shields.io/npm/dm/nestjs-objection.svg" alt="NPM Downloads" /></a>
<a href="https://www.npmjs.com/package/nestjs-objection"><img src="https://img.shields.io/npm/l/nestjs-objection.svg" alt="Package License" /></a>

## Table of Contents

- [Description](#description)
- [Installation](#installation)
- [Features](#features)
- [Examples](#examples)
- [Typescript](#typescript)
- [License](#license)

## Description
Integrates Objection.js and Knex with Nest

## Installation

```bash
$ npm install nestjs-objection knex objection
```

## Features

- Decorators ```@InjectModel, @Table, @Column, @Relation ```
- Synchronization ```synchronize(Model)```

## Examples
```bash
$ npm install nestjs-objection knex objection sqlite3
```

```ts
// app.models.ts
import { 
  Model, 
  Column, 
  Relation, 
  Table, 
  relationTypes, 
  columnTypes, 
} from 'nestjs-objection';

@Table({ tableName: 'posts' })
export class Post extends Model {
  @Column({ type: columnTypes.string })
  title: string;

  @Column({ type: columnTypes.json })
  json: { [key: string]: any };

  @Column({ type: columnTypes.integer })
  userId: number;
}

@Table({ tableName: 'users' })
export class User extends Model {
  @Column({ type: columnTypes.string })
  name: string;

  @Relation({ 
    modelClass: Post, 
    relation: relationTypes.HasManyRelation, 
    join: { from: 'users.id', to: 'posts.userId' } 
  })
  posts: Post[];
}
```

```ts
// app.module.ts
import { Module } from '@nestjs/common';
import { ObjectionModule, Model } from 'nestjs-objection'
import { AppController } from './app.controller';
import { User, Post } from './app.models';

@Module({
  imports: [
    ObjectionModule.forRoot({
      Model,
      config: {
        client: "sqlite3",
        useNullAsDefault: true,
        connection: ':memory:',
      }
    }),
    ObjectionModule.forFuture([User, Post]),
  ],
  controllers: [AppController],
})
export class AppModule {}
```

```ts
// app.controller.ts
import { Controller, Get, } from '@nestjs/common';
import { InjectModel, synchronize } from 'nestjs-objection';
import { User, Post } from './app.models';

@Controller()
export class AppController {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Post) private readonly postModel: typeof Post,
  ) {}

  @Get()
  async getHello() {
    // if (!await this.userModel.knex().schema.hasTable('users')) { 
    //   await User.knex().schema.createTable('users', table => {
    //     table.increments('id').primary();
    //     table.string('name');
    //   });
    // }
    // if (!await this.postModel.knex().schema.hasTable('posts')) { 
    //   await Post.knex().schema.createTable('posts', table => {
    //     table.increments('id').primary();
    //     table.integer('userId').references('users.id');
    //     table.string('title');
    //   });
    // }

    await synchronize(User);
    await synchronize(Post);
    await this.userModel.query().insert({ name: 'Name' });
    await this.postModel.query().insert({ title: 'Title', userId: 1 });

    const users = await this.userModel
      .query()
      .select(['users.name'])
      .withGraphJoined('posts')
      .modifyGraph('posts', q => q.select(['posts.title']));

    return { users }
  }
}
```

## Typescript

```ts
// src/index.d.ts
import { AnyQueryBuilder } from 'objection';

declare module 'objection' {
  interface WhereMethod<QB extends AnyQueryBuilder> {
    <T>(columns: Partial<T>): QB;
    <T>(column: Partial<keyof T>, op: string, value: any): QB;
  }
  interface OrderByMethod<QB extends AnyQueryBuilder> {
    <T>(column: keyof T, order?: 'asc' | 'desc'): QB;
    <T>(columns: (Array<{ column: keyof T; order?: 'asc' | 'desc' }>)): QB;
  }
  interface SelectMethod<QB extends AnyQueryBuilder> {
    <T>(...columnNames: Array<Partial<keyof T>>): QB;
    <T>(columnNames: Array<Partial<keyof T>>): QB;
  }
}
```

```ts
// with type-safe
const users = await this.userModel
  .query()
  .select<User>(['name'])
  .where<User>({ name: 'Name' })
  .orderBy<User>('name', 'desc')
  .withGraphFetched('posts')
  .modifyGraph('posts', q => q.select<Post>(['title']));

// without type-safe
const users = await this.userModel
  .query()
  .select(['name'])
  .where({ name: 'Name' })
  .orderBy('name', 'desc')
  .withGraphFetched('posts')
  .modifyGraph('posts', q => q.select(['title']));
```

## License

MIT
