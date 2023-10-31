import { Customer } from '../src/models';
import { TestServer } from './test-server';

const server = TestServer.init({
  definitions: [Customer],
});

describe('Paginate works', () => {
  beforeAll(async () => {
    await server.start();

    const customers = [
      { name: 'John', email: 'john@example.com', numberOfOrders: 10 },
      { name: 'Jane', email: 'jane@example.com', numberOfOrders: 15 },
      { name: 'Jack', email: 'jack@example.com', numberOfOrders: 20 },
      { name: 'Jill', email: 'jill@example.com', numberOfOrders: null },
      { name: 'Joe', email: 'joe@example.com', numberOfOrders: null },
    ];

    for (const customer of customers) {
      await server.makeSuccessRequest({
        query: `
          mutation CreateCustomer($input: CreateCustomerInput!) {
            createCustomer(input: $input) {
              id
            }
          }
        `,
        variables: { input: customer },
      });
    }
  });

  it('should return all customers', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!, $filter : CustomerFilter) {
          paginateCustomers(page: $page, limit: $limit,filter: $filter) {
            docs {
              email
              numberOfOrders
            }
            totalDocs
          }
        }
  `,
      variables: { page: 1, limit: 10, filter: {} },
    });
    expect(paginateCustomers.docs).toHaveLength(5);
    expect(paginateCustomers.totalDocs).toEqual(5);
  });

  const query = `
    query PaginateCustomers($filter: CustomerFilter){
      paginateCustomers(filter: $filter) {
        docs {
          email
          numberOfOrders
        }
        totalDocs
      }
    }
  `;

  it('eq', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { eq: 10 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'john@example.com', numberOfOrders: 10 }],
      totalDocs: 1,
    });
  });

  it('notEq', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { notEq: 20 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jane@example.com', numberOfOrders: 15 },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 4,
    });
  });

  it('in', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { in: ['John', 'Jane'] } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jane@example.com', numberOfOrders: 15 },
      ],
      totalDocs: 2,
    });
  });

  it('notIn', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { notIn: ['John', 'Jane'] } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jack@example.com', numberOfOrders: 20 },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 3,
    });
  });

  it('contains', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { contains: 'Ja' } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jane@example.com', numberOfOrders: 15 },
        { email: 'jack@example.com', numberOfOrders: 20 },
      ],
      totalDocs: 2,
    });
  });

  it('notContains', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { name: { notContains: 'Ja' } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 3,
    });
  });

  it('gt with lt', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { lt: 20, gt: 10 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'jane@example.com', numberOfOrders: 15 }],
      totalDocs: 1,
    });
  });

  it('gte with lte', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { lte: 20, gte: 10 } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jane@example.com', numberOfOrders: 15 },
        { email: 'jack@example.com', numberOfOrders: 20 },
      ],
      totalDocs: 3,
    });
  });

  it('regex with notRegex', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { email: { regex: 'jo', notRegex: 'john' } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [{ email: 'joe@example.com', numberOfOrders: null }],
      totalDocs: 1,
    });
  });

  it('exists = true', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { exists: true } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'john@example.com', numberOfOrders: 10 },
        { email: 'jane@example.com', numberOfOrders: 15 },
        { email: 'jack@example.com', numberOfOrders: 20 },
      ],
      totalDocs: 3,
    });
  });

  it('exists = false', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query,
      variables: { filter: { numberOfOrders: { exists: false } } },
    });

    expect(paginateCustomers).toEqual({
      docs: [
        { email: 'jill@example.com', numberOfOrders: null },
        { email: 'joe@example.com', numberOfOrders: null },
      ],
      totalDocs: 2,
    });
  });

  it('Paginate customer without page and limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers {
          paginateCustomers {
            docs {
              id
            }
            totalPages
            page
            limit
          }
        }
      `,
    });
    expect(paginateCustomers.docs.length).toBeLessThanOrEqual(10);
    expect(paginateCustomers.page).toEqual(1);
    expect(paginateCustomers.limit).toBeLessThanOrEqual(10);
  });

  it('Paginate customer with page but without limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!) {
          paginateCustomers(page: $page) {
            docs {
              id
            }
            totalPages
            page
            limit
          }
        }
      `,
      variables: {
        page: 1,
      },
    });
    expect(paginateCustomers.docs.length).toBeLessThanOrEqual(10);
    expect(paginateCustomers.page).toEqual(1);
    expect(paginateCustomers.limit).toEqual(10);
  });

  it('Paginate customer with page and limit', async () => {
    const { paginateCustomers } = await server.makeSuccessRequest({
      query: `
        query PaginateCustomers($page: Int!, $limit: Int!) {
          paginateCustomers(page: $page, limit: $limit) {
            docs {
              id
            }
            totalPages
            page
            limit
          }
        }
      `,
      variables: {
        page: 1,
        limit: 2,
      },
    });
    expect(paginateCustomers.docs.length).toBeLessThanOrEqual(2);
    expect(paginateCustomers.page).toEqual(1);
    expect(paginateCustomers.limit).toEqual(2);
  });

  afterAll(async () => {
    await server.stop();
  });
});