import {
  ApolloClient,
  ApolloLink,
  HttpLink,
  InMemoryCache,
} from 'apollo-boost';
import gql from 'graphql-tag';
import { getAccessToken, isLoggedIn } from './auth';

const enpointURL = 'http://localhost:9000/graphql';

const authLink = new ApolloLink((operation, forward) => {
  if (isLoggedIn()) {
    operation.setContext({
      headers: {
        authorization: 'Bearer ' + getAccessToken(),
      },
    });
  }
  return forward(operation);
});

// APOLLO CLIENT
const client = new ApolloClient({
  // how to connect to the server
  link: ApolloLink.from([authLink, new HttpLink({ uri: endpointURL })]),
  // cache implementation
  cache: new InMemoryCache(),
});

const companyQuery = gql`
  query CompanyQuery($id: ID!) {
    company(id: $id) {
      id
      name
      description
      jobs {
        id
        title
      }
    }
  }
`;

const jobDetailFragment = gql`
  fragment JobDetail on Job {
    id
    title
    company {
      id
      name
    }
    description
  }
`;

const createJobMutation = gql`
  mutation CreateJob($input: CreateJobInput) {
    job: createJob(input: $input) {
      ...JobDetail
    }
  }
  ${jobDetailFragment}
`;

const jobQuery = gql`
  query JobQuery($id: ID!) {
    ...JobDetail
    }
    }
  }
  ${jobDetailFragment}
`;

const jobsQuery = gql`
  query JobsQuery {
    jobs {
      id
      title
      company {
        id
        name
      }
    }
  }
`;

// mutation request
export async function createJob(input) {
  const {
    data: { job },
  } = await client.mutate({
    mutation: createJobMutation,
    variables: { input },
    update: (cache, { data }) => {
      console.log('mutationResult', data);
      // chose what is stored in the cache
      // what we're doing with this "update" function is tell Apollo Client whenever you run this mutation
      //take the data returned in the response and save it to the cache as if it was the result
      // of running the jobQuery for that specific job id this way when we actually run a jobQuery with that job id
      // it will find the data in the cache and avoid making a new call to the server
      cache.writeQuery({
        query: jobQuery,
        variables: { id: data.job.id },
        data,
      });
    },
  });
  return job;
}

export async function loadCompany(id) {
  const {
    data: { company },
  } = await client.query({ query: companyQuery, variables: { id } });
  return company;
}

export async function loadJob(id) {
  const {
    data: { job },
  } = await client.query({ query: jobQuery, variables: { id } });
  return job;
}

export async function loadJobs() {
  // customize caching
  const {
    data: { job },
  } = await client.query({ query: jobsQuery, fetchPolicy: 'no-cache' });
  return job;
}
