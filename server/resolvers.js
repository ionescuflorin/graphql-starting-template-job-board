const db = require('./db');

const Query = {
  company: (root, { id }) => db.companies.get(id),
  job: (root, args) => db.jobs.get(args.id),
  jobs: () => db.jobs.list(),
};

const Mutation = {
  createJob: (root, { input }, { user }) => {
    // check user auth
    if (!user) {
      throw new Error('Unauthorized');
    }
    //console.log('context', context)
    const id = db.jobs.create({ ...input, companyId: user.companyId });
    return db.jobs.get(id);
  },
};

const Company = {
  jobs: (company) =>
    db.jobs.list().filter((job) => job.companyId === company.id),
};

const Job = {
  // first arg is the parent object
  company: (job) => db.companies.get(job.companyId),
};

module.exports = { Query, Mutation, Company, Job };
