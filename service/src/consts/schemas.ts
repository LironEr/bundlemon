export const BaseRequestSchema = {
  $id: '#/definitions/BaseRequestSchema',
  type: 'object',
  properties: {
    body: {},
    query: {},
    params: {},
    headers: {},
  },
  additionalProperties: false,
};

export const CreateCommitRecordRequestSchema = {
  $id: '#/definitions/CreateCommitRecordRequestSchema',
  type: 'object',
  properties: {
    body: {
      $ref: '#/definitions/CommitRecordPayload',
    },
    query: {},
    params: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
      required: ['projectId'],
      additionalProperties: false,
    },
    headers: {
      type: 'object',
      properties: {
        'x-api-key': {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['x-api-key'],
      additionalProperties: false,
    },
  },
  required: ['body', 'params', 'headers'],
  additionalProperties: false,
};

export const CommitRecordPayload = {
  $id: '#/definitions/CommitRecordPayload',
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetails',
      },
    },
    groups: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetails',
      },
    },
    branch: {
      type: 'string',
    },
    commitSha: {
      type: 'string',
    },
    baseBranch: {
      type: 'string',
    },
    prNumber: {
      type: 'string',
    },
  },
  required: ['files', 'groups', 'branch', 'commitSha'],
  additionalProperties: false,
};

export const FileDetails = {
  $id: '#/definitions/FileDetails',
  type: 'object',
  properties: {
    pattern: {
      type: 'string',
    },
    path: {
      type: 'string',
    },
    size: {
      type: 'number',
    },
    compression: {
      $ref: '#/definitions/Compression',
    },
    maxSize: {
      type: 'number',
    },
    maxPercentIncrease: {
      type: 'number',
    },
  },
  required: ['pattern', 'path', 'size', 'compression'],
  additionalProperties: false,
};

export const Compression = {
  $id: '#/definitions/Compression',
  type: 'string',
  enum: ['none', 'gzip'],
};

export const GetCommitRecordRequestSchema = {
  $id: '#/definitions/GetCommitRecordRequestSchema',
  type: 'object',
  properties: {
    body: {},
    query: {},
    params: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
        recordId: {
          type: 'string',
        },
      },
      required: ['projectId', 'recordId'],
      additionalProperties: false,
    },
    headers: {},
  },
  required: ['params'],
  additionalProperties: false,
};

export const GetCommitRecordsQuery = {
  $id: '#/definitions/GetCommitRecordsQuery',
  type: 'object',
  properties: {
    branch: {
      type: 'string',
    },
    latest: {
      type: 'boolean',
    },
    resolution: {
      $ref: '#/definitions/CommitRecordsQueryResolution',
    },
  },
  required: ['branch'],
  additionalProperties: false,
};

export const CommitRecordsQueryResolution = {
  $id: '#/definitions/CommitRecordsQueryResolution',
  type: 'string',
  enum: ['all', 'days', 'weeks', 'months'],
};

export const GetCommitRecordsRequestSchema = {
  $id: '#/definitions/GetCommitRecordsRequestSchema',
  type: 'object',
  properties: {
    body: {},
    query: {
      $ref: '#/definitions/GetCommitRecordsQuery',
    },
    params: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
      required: ['projectId'],
      additionalProperties: false,
    },
    headers: {},
  },
  required: ['params', 'query'],
  additionalProperties: false,
};

export const CreateGithubCheckRequestSchema = {
  $id: '#/definitions/CreateGithubCheckRequestSchema',
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        report: {
          $ref: '#/definitions/Report',
        },
        git: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
            },
            repo: {
              type: 'string',
            },
            commitSha: {
              type: 'string',
            },
          },
          required: ['owner', 'repo', 'commitSha'],
          additionalProperties: false,
        },
      },
      required: ['report', 'git'],
      additionalProperties: false,
    },
    query: {},
    params: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
      required: ['projectId'],
      additionalProperties: false,
    },
    headers: {
      type: 'object',
      properties: {
        'x-api-key': {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['x-api-key'],
      additionalProperties: false,
    },
  },
  required: ['body', 'params', 'headers'],
  additionalProperties: false,
};

export const Report = {
  $id: '#/definitions/Report',
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetailsDiff',
      },
    },
    stats: {
      $ref: '#/definitions/DiffStats',
    },
    groups: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetailsDiff',
      },
    },
    status: {
      $ref: '#/definitions/Status',
    },
    metadata: {
      $ref: '#/definitions/ReportMetadata',
    },
  },
  required: ['files', 'groups', 'metadata', 'stats', 'status'],
  additionalProperties: false,
};

export const DiffReport = {
  $id: '#/definitions/DiffReport',
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetailsDiff',
      },
    },
    stats: {
      $ref: '#/definitions/DiffStats',
    },
    groups: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetailsDiff',
      },
    },
    status: {
      $ref: '#/definitions/Status',
    },
  },
  required: ['files', 'stats', 'groups', 'status'],
  additionalProperties: false,
};

export const FileDetailsDiff = {
  $id: '#/definitions/FileDetailsDiff',
  anyOf: [
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        status: {
          type: 'string',
          const: 'Pass',
        },
        failReasons: {
          not: {},
        },
        diff: {
          $ref: '#/definitions/DiffFromBase',
        },
        pattern: {
          type: 'string',
        },
        path: {
          type: 'string',
        },
        size: {
          type: 'number',
        },
        compression: {
          $ref: '#/definitions/Compression',
        },
        maxSize: {
          type: 'number',
        },
        maxPercentIncrease: {
          type: 'number',
        },
      },
      required: ['compression', 'diff', 'path', 'pattern', 'size', 'status'],
    },
    {
      type: 'object',
      additionalProperties: false,
      properties: {
        status: {
          type: 'string',
          const: 'Fail',
        },
        failReasons: {
          type: 'array',
          items: {
            $ref: '#/definitions/FailReason',
          },
        },
        diff: {
          $ref: '#/definitions/DiffFromBase',
        },
        pattern: {
          type: 'string',
        },
        path: {
          type: 'string',
        },
        size: {
          type: 'number',
        },
        compression: {
          $ref: '#/definitions/Compression',
        },
        maxSize: {
          type: 'number',
        },
        maxPercentIncrease: {
          type: 'number',
        },
      },
      required: ['compression', 'diff', 'failReasons', 'path', 'pattern', 'size', 'status'],
    },
  ],
};

export const DiffFromBase = {
  $id: '#/definitions/DiffFromBase',
  type: 'object',
  properties: {
    bytes: {
      type: 'number',
    },
    percent: {
      type: 'number',
    },
    change: {
      $ref: '#/definitions/DiffChange',
    },
  },
  required: ['bytes', 'percent', 'change'],
  additionalProperties: false,
};

export const DiffChange = {
  $id: '#/definitions/DiffChange',
  type: 'string',
  enum: ['No change', 'Update', 'Add', 'Remove'],
};

export const FailReason = {
  $id: '#/definitions/FailReason',
  type: 'string',
  enum: ['MaxSize', 'MaxPercentIncrease'],
};

export const DiffStats = {
  $id: '#/definitions/DiffStats',
  type: 'object',
  properties: {
    currBranchSize: {
      type: 'number',
    },
    baseBranchSize: {
      type: 'number',
    },
    diff: {
      type: 'object',
      properties: {
        bytes: {
          type: 'number',
        },
        percent: {
          type: 'number',
        },
      },
      required: ['bytes', 'percent'],
      additionalProperties: false,
    },
  },
  required: ['currBranchSize', 'baseBranchSize', 'diff'],
  additionalProperties: false,
};

export const Status = {
  $id: '#/definitions/Status',
  type: 'string',
  enum: ['Pass', 'Fail'],
};

export const ReportMetadata = {
  $id: '#/definitions/ReportMetadata',
  type: 'object',
  properties: {
    linkToReport: {
      type: 'string',
    },
    record: {
      $ref: '#/definitions/CommitRecord',
    },
    baseRecord: {
      $ref: '#/definitions/CommitRecord',
    },
  },
  additionalProperties: false,
};

export const CommitRecord = {
  $id: '#/definitions/CommitRecord',
  type: 'object',
  properties: {
    files: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetails',
      },
    },
    groups: {
      type: 'array',
      items: {
        $ref: '#/definitions/FileDetails',
      },
    },
    branch: {
      type: 'string',
    },
    commitSha: {
      type: 'string',
    },
    baseBranch: {
      type: 'string',
    },
    prNumber: {
      type: 'string',
    },
    id: {
      type: 'string',
    },
    projectId: {
      type: 'string',
    },
    creationDate: {
      type: 'string',
    },
  },
  required: ['branch', 'commitSha', 'creationDate', 'files', 'groups', 'id', 'projectId'],
  additionalProperties: false,
};

export const CreateGithubCommitStatusRequestSchema = {
  $id: '#/definitions/CreateGithubCommitStatusRequestSchema',
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        report: {
          $ref: '#/definitions/Report',
        },
        git: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
            },
            repo: {
              type: 'string',
            },
            commitSha: {
              type: 'string',
            },
          },
          required: ['owner', 'repo', 'commitSha'],
          additionalProperties: false,
        },
      },
      required: ['report', 'git'],
      additionalProperties: false,
    },
    query: {},
    params: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
      required: ['projectId'],
      additionalProperties: false,
    },
    headers: {
      type: 'object',
      properties: {
        'x-api-key': {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['x-api-key'],
      additionalProperties: false,
    },
  },
  required: ['body', 'params', 'headers'],
  additionalProperties: false,
};

export const PostGithubPRCommentRequestSchema = {
  $id: '#/definitions/PostGithubPRCommentRequestSchema',
  type: 'object',
  properties: {
    body: {
      type: 'object',
      properties: {
        report: {
          $ref: '#/definitions/Report',
        },
        git: {
          type: 'object',
          properties: {
            owner: {
              type: 'string',
            },
            repo: {
              type: 'string',
            },
            prNumber: {
              type: 'string',
            },
          },
          required: ['owner', 'repo', 'prNumber'],
          additionalProperties: false,
        },
      },
      required: ['report', 'git'],
      additionalProperties: false,
    },
    query: {},
    params: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          pattern: '^[0-9a-fA-F]{24}$',
        },
      },
      required: ['projectId'],
      additionalProperties: false,
    },
    headers: {
      type: 'object',
      properties: {
        'x-api-key': {
          type: 'string',
          minLength: 1,
        },
      },
      required: ['x-api-key'],
      additionalProperties: false,
    },
  },
  required: ['body', 'params', 'headers'],
  additionalProperties: false,
};
