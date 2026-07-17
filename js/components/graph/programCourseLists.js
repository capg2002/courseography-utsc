export const PROGRAM_RULES = {
  // SCMAJ2289 (Stats Major)
  SCMAJ2289: [
    // must_have
    { type: "must", courses: ["CSCA08H3", "MATA22H3", "MATB24H3", "MATB41H3", "MATB42H3", "STAB57H3", "STAC67H3"] },

    // choose_k_of
    { type: "choose", k: 1, courses: ["MATA30H3", "MATA31H3"] },
    { type: "choose", k: 1, courses: ["MATA36H3", "MATA37H3"] },
    { type: "choose", k: 1, courses: ["STAB52H3", "STAB53H3"] },

    // pools
    {
      type: "pool",
      id: "SCMAJ2289_pool_1",
      k: 3,
      priority: 1,
      accepts: {
        deptPrefix: ["STA"],
        levelIn: ["C", "D"],
        not: {
          codeIn: ["STAC32H3", "STAC53H3", "STAD29H3", "STAC67H3"],
        },
      },
    },
    {
      type: "pool",
      id: "SCMAJ2289_pool_2",
      k: 3,
      priority: 2,
      accepts: {
        anyOf: [
          {
            deptPrefixIn: ["CSC", "MAT", "STA"],
            levelIn: ["C", "D"],
            not: {
              codeIn: ["STAC67H3"],
            },
          },
          {
            codeIn: ["STAA57H3", "STAB40H3", "STAB41H3", "MATB61H3", "STAB57H3", "MATD50H3"],
            not: {
              codeIn: ["STAC67H3"],
            },
          },
        ],
      },
    },
  ],

  // SCSPE0510 (CS Comprehensive Specialist)
  SCSPE0510: [
    { type: "must",
      courses: [
        "CSCA08H3","CSCA48H3","CSCA67H3","MATA22H3","MATA31H3","MATA37H3",
        "CSCB07H3","CSCB09H3","CSCB36H3","CSCB58H3","CSCB63H3",
        "MATB24H3","STAB52H3","CSCC43H3","CSCC69H3","CSCC73H3","CSCD03H3",
        "CSCC24H3","CSCC37H3","CSCC63H3","CSCD37H3","MATB41H3"
      ]
    },

    {
      type: "pool",
      id: "SCSPE0510_pool_1",
      k: 2,
      priority: 1,
      accepts: {
        codeIn: [
          "CSCC01H3","CSCC09H3","CSCC10H3","CSCC11H3","CSCC46H3","CSCC85H3",
          "CSCD01H3","CSCD18H3","CSCD25H3","CSCD27H3","CSCD43H3","CSCD58H3",
          "CSCD70H3","CSCD83H3"
        ],
      },
    },
    {
      type: "pool",
      id: "SCSPE0510_pool_2",
      k: 1,
      priority: 2,
      accepts: { codeIn: ["MATC09H3","MATC32H3","MATC44H3","MATD16H3"] },
    },
    {
      type: "pool",
      id: "SCSPE0510_pool_3",
      k: 1,
      priority: 3,
      accepts: {
        levelIn: ["C", "D"],
        not: {
          codeIn: [
            "MATC09H3","MATC32H3","MATC44H3","MATD16H3",
            "CSCC01H3","CSCC09H3","CSCC10H3","CSCC11H3","CSCC46H3","CSCC85H3",
            "CSCD01H3","CSCD18H3","CSCD25H3","CSCD27H3","CSCD43H3","CSCD58H3",
            "CSCD70H3","CSCD83H3",
            "MATC82H3","MATC90H3","STAC32H3","STAC53H3","STAD29H3"
          ],
        },
      },
    },
  ],

  // SCSPE0795 (CS Software Eng Stream)
  SCSPE0795: [
    { type: "must",
      courses: [
        "CSCA08H3","CSCA48H3","CSCA67H3",
        "MATA22H3","MATA31H3","MATA37H3",
        "CSCB07H3","CSCB09H3","CSCB36H3",
        "CSCB58H3","CSCB63H3","MATB24H3","STAB52H3",
        "CSCC43H3","CSCC69H3","CSCC73H3",
        "CSCD03H3",
        "CSCC01H3","CSCC24H3","CSCC37H3",
        "CSCC63H3","CSCD01H3","MATB41H3"
      ]
    },
    { type: "choose", k: 3,
      courses: [
        "CSCC09H3","CSCC10H3","CSCC11H3","CSCC46H3",
        "CSCC85H3","CSCD18H3","CSCD25H3","CSCD27H3",
        "CSCD43H3","CSCD58H3","CSCD70H3","CSCD84H3"
      ]
    },
  ],

  // SCMAJ1165 (Math Major)
  SCMAJ1165: [
    { type: "must",
      courses: ["CSCA08H3", "MATA22H3","MATA31H3","MATA37H3","MATB24H3","MATB41H3","MATB42H3","MATB44H3","STAB52H3"]
    },
    { type: "choose", k: 1, courses: ["MATA67H3", "CSCA67H3"] },

    {
      type: "pool",
      id: "SCMAJ1165_pool_1",
      k: 1,
      priority: 1,
      accepts: { codeIn: ["MATC01H3", "MATC15H3"] },
    },
    {
      type: "pool",
      id: "SCMAJ1165_pool_2",
      k: 2,
      priority: 2,
      accepts: { codeIn: ["MATB43H3","MATC27H3","MATC46H3","MATC34H3","MATD35H3","MATD67H3"] },
    },
    {
      type: "pool",
      id: "SCMAJ1165_pool_3",
      k: 2,
      priority: 3,
      accepts: { codeIn: ["MATC01H3","MATC09H3","MATC15H3","MATC32H3","MATC44H3","MATC63H3","MATD01H3","MATD02H3","MATD44H3"] },
    },
    {
      type: "pool",
      id: "SCMAJ1165_pool_4",
      k: 2,
      priority: 4,
      accepts: {
        anyOf: [
          { codeIn: ["MATB61H3", "STAB57H3"] },
          {
            levelIn: ["C","D"],
            not: { codeIn: ["STAC32H3","STAC53H3","STAD29H3","STAC67H3"], },
          }
        ]
      }
    },
  ],

  // SCMAJ1688 (Comp Sci Major)
  SCMAJ1688: [
    { type: "must",
      courses: [
        "CSCA08H3","CSCA48H3","CSCA67H3",
        "MATA22H3","MATA31H3","MATA37H3",
        "CSCB07H3","CSCB09H3","CSCB36H3","CSCB58H3","CSCB63H3",
        "CSCC37H3"
      ]
    },
    { type: "choose", k: 1, courses: ["MATB24H3","STAB52H3"] },

    {
      type: "pool",
      id: "SCMAJ1688_pool_1",
      k: 1,
      priority: 1,
      accepts: { codeIn: ["CSCC63H3", "CSCC73H3"] },
    },
    {
      type: "pool",
      id: "SCMAJ1688_pool_2",
      k: 2,
      priority: 2,
      accepts: {
        deptPrefix: ["CSC"],
        levelIn: ["C","D"],
        not: { codeIn: ["CSCC37H3"] },
      },
    },
  ],

  // SCMIN1688 (CS Minor)
  SCMIN1688: [
    { type: "must", courses: ["CSCA08H3", "CSCA48H3"] },

    { type: "choose", k: 1, courses: ["CSCA67H3","MATA22H3","MATA23H3","MATA30H3","MATA31H3","MATA34H3"] },
    { type: "choose", k: 3, courses: ["CSCB07H3","CSCB09H3","CSCB20H3","CSCB36H3","CSCB58H3","CSCB63H3"] },
    { type: "choose", k: 2,
      courses: [
        "CSCC01H3","CSCC09H3","CSCC10H3","CSCC11H3","CSCC24H3","CSCC37H3","CSCC43H3","CSCC46H3","CSCC63H3","CSCC69H3","CSCC73H3","CSCC85H3",
        "CSCD01H3","CSCD03H3","CSCD18H3","CSCD21H3","CSCD27H3","CSCD37H3","CSCD43H3","CSCD54H3","CSCD58H3","CSCD70H3","CSCD71H3","CSCD84H3",
        "CSCD90H3","CSCD92H3","CSCD94H3","CSCD93H3","CSCD95H3"
      ]
    },
  ],

  // SCMIN2289 (Stats Minor)
  SCMIN2289: [
    { type: "must", courses: ["STAB57H3", "STAC67H3"] },

    { type: "choose", k: 1, courses: ["CSCA08H3", "CSCA20H3"] },
    { type: "choose", k: 1, courses: ["MATA23H3", "MATA22H3"] },
    { type: "choose", k: 1, courses: ["MATA30H3", "MATA31H3"] },
    { type: "choose", k: 1, courses: ["MATA36H3", "MATA37H3"] },
    { type: "choose", k: 1, courses: ["STAB52H3", "STAB53H3"] },
    { type: "choose", k: 1,
      courses: [
        "STAC33H3","STAC50H3","STAC51H3","STAC58H3","STAC62H3","STAC63H3","STAC70H3",
        "STAD37H3","STAD57H3","STAD68H3","STAD70H3","STAD80H3",
        "STAD92H3","STAD93H3","STAD94H3","STAD95H3"
      ]
    },
  ],

  // SCSPE0455 (Information Systems Spec)
  SCSPE0455: [
    { type: "must",
      courses: [
        "CSCA08H3","CSCA48H3","CSCA67H3","MATA22H3","MATA31H3","MATA37H3",
        "CSCB07H3","CSCB09H3","CSCB36H3","CSCB58H3","CSCB63H3",
        "MATB24H3","STAB52H3","CSCC43H3","CSCC69H3","CSCC73H3","CSCD03H3",
        "CSCC01H3","CSCC37H3","CSCC63H3","CSCD01H3","CSCD43H3","MATB41H3"
      ]
    },
    { type: "choose", k: 2,
      courses: ["CSCC09H3","CSCC10H3","CSCC11H3","CSCC46H3","CSCC85H3","CSCD18H3","CSCD25H3","CSCD27H3","CSCD58H3","CSCD70H3","CSCD84H3"]
    },
  ],

  // SCSPE2289Z (ML Stats Spec)
  SCSPE2289Z: [
    { type: "must",
      courses: [
        "CSCA08H3","CSCA48H3","MATA22H3","MATA31H3","MATA37H3",
        "MATB24H3","MATB41H3","MATB61H3","STAB52H3","STAB57H3",
        "CSCC37H3","STAC62H3","STAC67H3","STAD37H3",
        "CSCA48H3","CSCB07H3","CSCB36H3","CSCB63H3","CSCC11H3","STAC58H3"
      ]
    },
    { type: "choose", k: 1, courses: ["MATA67H3", "CSCA67H3"] },
    { type: "choose", k: 1, courses: ["CSCB20H3", "STAA57H3"] },

    { type: "pool", id: "SCSPE2289Z_pool_1", k: 1, priority: 1, accepts: { codeIn: ["STAD68H3", "STAD78H3"] } },
    {
      type: "pool",
      id: "SCSPE2289Z_pool_2",
      k: 3,
      priority: 2,
      accepts: {
        levelIn: ["C","D"],
        not: { codeIn: ["CSCC37H3","STAC62H3","STAC67H3","STAD37H3","CSCC11H3","STAC58H3"] },
      },
    },
  ],

  // SCSPE11659 (Math Comprehensive Stream)
  SCSPE11659: [
    { type: "must",
      courses: ["CSCA08H3", "MATA22H3","MATA31H3","MATA37H3","MATB24H3","MATB41H3","STAB52H3","STAB57H3","MATB42H3","MATB43H3","MATB44H3","MATC01H3","MATC34H3"]
    },
    { type: "choose", k: 1, courses: ["MATA67H3","CSCA67H3"] },

    { type: "pool", id: "SCSPE11659_pool_1", k: 3, priority: 1, accepts: { codeIn: ["MATC37H3","MATC46H3","MATD01H3","MATD35H3"] } },
    { type: "pool", id: "SCSPE11659_pool_2", k: 2, priority: 2, accepts: { codeIn: ["MATC15H3","MATC27H3","MATC63H3","MATD02H3","MATD34H3"] } },
    { type: "pool", id: "SCSPE11659_pool_3", k: 2, priority: 3, accepts: { codeIn: ["CSCC37H3","CSCC63H3","CSCC73H3","MATC09H3","MATC32H3","MATC44H3","MATD16H3","MATD44H3"] } },
    {
      type: "pool",
      id: "SCSPE11659_pool_4",
      k: 3,
      priority: 4,
      accepts: { deptPrefix: ["MAT"], levelIn: ["C","D"], not: { codeIn: ["MATC01H3","MATC34H3"] } },
    },
  ],

  // SCMIN2295 (Applied Stats Minor)
  SCMIN2295: [
    { type: "must", courses: ["STAC32H3","STAC53H3","STAD29H3"] },
    { type: "choose", k: 1, courses: ["CSCA08H3","CSCA20H3"] },
    { type: "choose", k: 1, courses: ["STAB22H3", "STAB23H3"]}
  ],

  // SCSPE2289F (Quant Fin Stats Spec)
  SCSPE2289F: [
    { type: "must",
      courses: [
        "CSCA08H3", "MATA22H3","MATA31H3","MATA37H3","MATB24H3","MATB41H3","MATB61H3",
        "STAB52H3","STAB57H3","CSCC37H3","STAC62H3","STAC67H3","STAD37H3",
        "STAB40H3","MATB42H3","MATB44H3","STAB41H3","MATC46H3","STAC70H3","STAD57H3","STAD70H3"
      ]
    },
    { type: "choose", k: 1, courses: ["MATA67H3","CSCA67H3"] },
    { type: "choose", k: 2,
      courses: ["CSCC11H3","MATC37H3","STAC51H3","STAC58H3","STAC63H3","STAD68H3","STAD92H3","STAD93H3","STAD94H3","STAD95H3"]
    },
  ],

  // SCSPE11655 (Math Stats Stream)
  SCSPE11655: [
    { type: "must",
      courses: [
        "CSCA08H3", "MATA22H3","MATA31H3","MATA37H3","MATB24H3","MATB41H3","STAB52H3","STAB57H3",
        "MATB42H3","MATB43H3","MATB44H3","MATC01H3","MATC34H3",
        "MATB61H3","MATC46H3","MATD01H3","STAC58H3","STAC62H3","STAC67H3"
      ]
    },
    { type: "choose", k: 1, courses: ["MATA67H3","CSCA67H3"] },

    { type: "pool", id: "SCSPE11655_pool_1", k: 1, priority: 1, accepts: { codeIn: ["MATC32H3","MATC44H3","MATD02H3","MATD44H3","MATD50H3"] } },
    {
      type: "pool",
      id: "SCSPE11655_pool_2",
      k: 2,
      priority: 2,
      accepts: { deptPrefix: ["MAT"], levelIn: ["C","D"], not: { codeIn: ["MATC01H3","MATC34H3","MATC46H3","MATD01H3"] } },
    },
    {
      type: "pool",
      id: "SCSPE11655_pool_3",
      k: 2,
      priority: 3,
      accepts: { deptPrefix: ["STA"], levelIn: ["C","D"], not: { codeIn: ["STAC58H3","STAC62H3","STAC67H3","STAC32H3","STAC53H3","STAD29H3"] } },
    },
  ],

  // SCSPE11653 (Math Teaching Stream Spec)
  SCSPE11653: [
    { type: "must",
      courses: ["CSCA08H3","MATA22H3","MATA31H3","MATA37H3","MATB24H3","MATB41H3","STAB52H3","STAB57H3","MATB42H3","MATB43H3","MATB44H3","MATC01H3","MATC34H3"]
    },
    { type: "choose", k: 1, courses: ["MATA67H3","CSCA67H3"] },

    { type: "pool", id: "SCSPE11653_pool_1", k: 3, priority: 1, accepts: { codeIn: ["MATC15H3","MATC46H3","MATD01H3","MATD02H3","MATD35H3"] } },
    { type: "pool", id: "SCSPE11653_pool_2", k: 1, priority: 2, accepts: { codeIn: ["MATC32H3","MATC44H3","MATD44H3"] } },
    {
      type: "pool",
      id: "SCSPE11653_pool_3",
      k: 3,
      priority: 3,
      accepts: { deptPrefix: ["MAT"], levelIn: ["C","D"], not: { codeIn: ["MATC01H3","MATC34H3"] } },
    },
    {
      type: "pool",
      id: "SCSPE11653_pool_4",
      k: 4,
      priority: 4,
      accepts: {
        levelIn: ["C","D"],
        not: { codeIn: ["MATC01H3","MATC34H3","STAC32H3","STAC53H3","STAD29H3"] },
      },
    },
  ],

  // SCSPE0805 (Entrepreneurship Stream)
  SCSPE0805: [
    { type: "must",
      courses: [
        "CSCA08H3","CSCA48H3","CSCA67H3","MATA22H3","MATA31H3","MATA37H3",
        "CSCB07H3","CSCB09H3","CSCB36H3","CSCB58H3","CSCB63H3",
        "MATB24H3","STAB52H3","CSCC43H3","CSCC69H3","CSCC73H3","CSCD03H3",
        "CSCC01H3","CSCC37H3","CSCC63H3","CSCD01H3","CSCD54H3","CSCD90H3"
      ]
    },
    { type: "choose", k: 3,
      courses: ["CSCC09H3","CSCC10H3","CSCC11H3","CSCC24H3","CSCC46H3","CSCC85H3","CSCD18H3","CSCD25H3","CSCD27H3","CSCD43H3","CSCD58H3","CSCD70H3","CSCD84H3","MATB41H3","STAB57H3"]
    },
  ],

  // SCSPE2279F (Statistical Sciences Stream)
  SCSPE2279F: [
    { type: "must",
      courses: [
        "CSCA08H3", "MATA22H3","MATA31H3","MATA37H3","MATB24H3","MATB41H3","MATB61H3",
        "STAB52H3","STAB57H3","CSCC37H3","STAC62H3","STAC67H3","STAD37H3",
        "STAA57H3","MATB42H3","MATB44H3","STAC33H3","STAC50H3","STAC51H3",
        "STAC58H3","STAC63H3","STAD57H3"
      ]
    },
    { type: "choose", k: 1, courses: ["MATA67H3","CSCA67H3"] },
    { type: "choose", k: 2,
      courses: ["CSCC11H3","MATC34H3","MATC37H3","STAD68H3","STAD78H3","STAD80H3","STAD92H3","STAD93H3","STAD94H3","STAD95H3"]
    },
  ],
};