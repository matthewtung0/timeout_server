const session = require('../models/Session');
const counter = require('../models/Counter')
const express = require('express')
const db = require('../db')
const Router = require('express-promise-router');
const requireAuth = require('../middlewares/requireAuth');
const { format, parseISO, compareAsc } = require('date-fns');
const { enUS } = require('date-fns/locale/en-US');

const router = new Router();
router.use(requireAuth)


router.get('/session/:id', async (req, res) => {
    let id = req.params.id
    console.log("Getting /session with id", id)
    try {
        rows = await session.getSession(id);
        console.log("Rows got", rows)
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving sessions")
        return res.status(403).send({ error: "Probably retrieving session" });
    }
})

// for profile use only
router.get('/session', async (req, res) => {
    let username = req.query.username
    let id = req.query.id
    let getPrivate = req.query.getPrivate
    const user_id = req.user_id
    const startIndex = req.query.startIndex

    var start = 0
    if (typeof (startIndex) != 'undefined') { start = startIndex } else { start = 0; }

    console.log("start index is", startIndex);
    console.log("user id is", id);
    try {
        var rows = undefined

        if (typeof (id) != 'undefined') {
            rows = await session.getSessionBatch(start, 10, id);
            console.log("Results:", rows);
        } else {
            rows = await session.getSessionBatchByUsername(start, 10, username);
        }
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving session feed:", err)
        return res.status(403).send({ error: "Probably retrieving session feed!" });
    }
})


router.get('/sessionFeed', async (req, res) => {
    const user_id = req.user_id
    const startIndex = req.query.startIndex
    var numToRetrieve = req.query.numToRetrieve

    //list of friend id's
    let friends = req.query.friends

    if (friends) {
        //friends.push(user_id) // COMMENT THIS OUT LATER
    } else {
        friends = [];
        res.status(200).send([])
        return;
        //friends = [user_id]
    }

    var start = 0
    if (startIndex) {
        start = startIndex;
    } else {
        start = 0;
    }

    if (!numToRetrieve) {
        numToRetrieve = 100;
    }
    console.log(`Friends is ${friends} and startIndex is ${start}`)

    try {
        var rows = undefined
        //rows = await session.getSelfSessionsBatch(start, 10, user_id)
        console.log(`Trying with start: ${start} and friends ${friends}`)
        rows = await session.getSessionBatch(start, numToRetrieve, friends);
        console.log("Num rows to return ", rows.length)
        res.status(200).send(rows)
    } catch (err) {
        console.log("Problem retrieving session feed:", err)
        return res.status(403).send({ error: "Probably retrieving session feed!" });
    }
})

/*
router.get('/daySessions', async (req, res) => {
    const startRange = req.query.startTime
    const endRange = req.query.endTime
    console.log("getting session for day ", startRange)
    try {
        let user_id = req.user_id

        let result = await session.get_day_session(startRange, endRange, user_id)
        res.send(result)

    } catch (err) {
        console.log("error getting day's session: ", err)
        return res.status(422).send({ error: "Error getting day's session!" });
    }
})*/

const byMonthKey = (dt, parse = false) => {
    if (parse) {
        return format(parseISO(dt), 'M/yyyy', { locale: enUS }).toString()
    }
    return format(dt, 'M/yyyy', { locale: enUS }).toString()

}

const byDayKey = (dt, parse = false) => {
    if (parse) {
        var actual_date = format(parseISO(dt), 'M/dd/yyyy', { locale: enUS })
        var actual_parts = actual_date.split('/')
        var yr = actual_parts[2]
        var month = actual_parts[0]
        var day = actual_parts[1]

        return month + "/" + day + "/" + yr
    } else {
        var actual_date = format(dt, 'M/dd/yyyy', { locale: enUS })
        var actual_parts = actual_date.split('/')
        var yr = actual_parts[2]
        var month = actual_parts[0]
        var day = actual_parts[1]

        return month + "/" + day + "/" + yr
    }

}

// key is month only, for summary
const groupMonthlyTasksForSummary = (monthSessions) => {
    var overallMap = {}
    for (var i = 0; i < monthSessions.length; i++) {
        var session = monthSessions[i]
        var monthKey = byMonthKey(session.time_start)

        if (monthKey in overallMap) {
            overallMap[monthKey].push(session)
        } else {
            overallMap[monthKey] = [session]
        }
    }
    return overallMap //Object.entries(overallMap)
}

// only group by day, since we will include all months together
const groupMonthlyTasksForSearch = (monthSessions) => {
    var overallMap = {}
    for (var i = 0; i < monthSessions.length; i++) {
        var session = monthSessions[i]
        var dayKey = byDayKey(session.time_start)
        //var monthKey = byMonthKey(session.time_start)

        if (dayKey in overallMap) {
            overallMap[dayKey].push(session)
        } else {
            overallMap[dayKey] = [session]
        }
    }
    var mapToArray = Object.keys(overallMap).map((key) => [key, overallMap[key]])
    mapToArray.sort((a, b) => {
        var a_split = a[0].split('/');
        var b_split = b[0].split('/');
        var a_yr = parseInt(a_split[2])
        var a_month = parseInt(a_split[0])
        var a_day = parseInt(a_split[1])
        var b_yr = parseInt(b_split[2])
        var b_month = parseInt(b_split[0])
        var b_day = parseInt(b_split[1])

        if (a_yr > b_yr) {
            return -1
        }
        if (b_yr > a_yr) {
            return 1
        }
        if (a_month > b_month) {
            return -1
        }
        if (b_month > a_month) {
            return 1
        }
        if (a_day > b_day) {
            return -1
        }
        return 1
    })
    console.log("OVERALL MAP ", mapToArray)
    return mapToArray
}

// key is month as well as day, for detail
const groupMonthlyTasks = (monthSessions) => {
    var overallMap = {}
    for (var i = 0; i < monthSessions.length; i++) {
        var session = monthSessions[i]
        var dayKey = byDayKey(session.time_start)
        var monthKey = byMonthKey(session.time_start)

        if (monthKey in overallMap) {
            if (dayKey in overallMap[monthKey]) {
                overallMap[monthKey][dayKey].push(session)
            } else {
                overallMap[monthKey][dayKey] = [session]
            }
        } else {
            overallMap[monthKey] = {}
            overallMap[monthKey][dayKey] = [session]
        }
    }
    var intermediateMap = {}
    for (const [key, value] of Object.entries(overallMap)) {
        intermediateMap[key] = {}
        for (var i in Object.entries(value)) {
            // sort this: Object.entries(value)[i][1]
            Object.entries(value)[i][1].sort((a, b) => {
                if (a.entry_type == 1 && b.entry_type == 1) { // do alphabetical
                    if (a.activity_name <= b.activity_name) {
                        return -1
                    } return 1
                }
                else if (a.entry_type == 1) {
                    return -1
                }
                return 1
            })
        }
        var dayKeyArray = Object.keys(overallMap[key]).sort().reverse()
        for (var key_ in dayKeyArray) {
            intermediateMap[key][dayKeyArray[key_]] = overallMap[key][dayKeyArray[key_]]
        }
    }
    // map to existing format that works
    var finalMap = {}
    for (var K in intermediateMap) {
        finalMap[K] = Object.keys(intermediateMap[K]).map((key) => [key, intermediateMap[K][key]])
    }
    console.log("fINAL MAP ", finalMap)
    return finalMap
}

/* get sessions and counters together, format server-side, then send over */

router.get('/testSessionsAndCounters', async (req, res) => {
    const startRange = req.query.startTime
    const endRange = req.query.endTime
    let sessionData = null;
    let counterData = null;
    console.log(`getting sessions for month ${startRange} and ending at month ${endRange}`)
    try {
        let user_id = req.user_id

        sessionData = await session.get_day_session(startRange, endRange, user_id)
        //res.send(result)

    } catch (err) {
        console.log("error getting month's session: ", err)
        return res.status(422).send({ error: "Error getting month's session!" });
    }

    console.log(`getting counters for month ${startRange} and ending at month ${endRange}`)
    try {
        let user_id = req.user_id
        counterData = await counter.getCounterRange(startRange, endRange, user_id)
        //res.send(result)
    } catch (err) {
        console.log("error getting month's counters: ", err)
        return res.status(422).send({ error: "Error getting month's counters!" });
    }
    let combinedData = sessionData.concat(counterData)
    let groupedData = groupMonthlyTasks(combinedData)
    let groupedDataForSummary = groupMonthlyTasksForSummary(combinedData);

    //console.log("Session raw data: ", sessionData)
    //console.log("Counter raw data: ", counterData)
    //console.log("Combined data: ", groupedCombinedData)

    res.send({ groupedData, groupedDataForSummary })
})

router.get('/searchSessionsAndCounters', async (req, res) => {
    const searchTerm = req.query.searchTerm
    const searchCatId = req.query.searchCatId
    let sessionData = null;
    let counterData = null;
    console.log(`getting sessions with search term ${searchTerm} and category ${searchCatId}`)
    try {
        let user_id = req.user_id

        sessionData = await session.get_session_by_search(searchTerm, searchCatId, user_id)
        //res.send(result)

    } catch (err) {
        console.log("error getting session search results: ", err)
        return res.status(422).send({ error: "Error getting session search results!" });
    }
    try {
        let user_id = req.user_id
        counterData = await counter.get_counter_by_search(searchTerm, searchCatId, user_id)
        //res.send(result)
    } catch (err) {
        console.log("error getting counter search results: ", err)
        return res.status(422).send({ error: "Error getting counter search results!" });
    }
    let combinedData = sessionData.concat(counterData)
    let groupedData = groupMonthlyTasksForSearch(combinedData)
    //let groupedData = groupMonthlyTasks(combinedData)
    let groupedDataForSummary = groupMonthlyTasksForSummary(combinedData);

    //console.log("Session raw data: ", sessionData)
    //console.log("Counter raw data: ", counterData)
    //console.log("Combined data: ", groupedCombinedData)

    res.send({ groupedData, groupedDataForSummary })
})


router.get('/monthSessions', async (req, res) => {
    const startRange = req.query.startTime
    const endRange = req.query.endTime
    console.log(`getting sessions for month ${startRange} and ending at month ${endRange}`)
    try {
        let user_id = req.user_id

        let result = await session.get_day_session(startRange, endRange, user_id)
        res.send(result)

    } catch (err) {
        console.log("error getting month's session: ", err)
        return res.status(422).send({ error: "Error getting month's session!" });
    }
})

router.post('/save_session', async (req, res) => {

    // req.body is an array of len 1 or more
    for (const element of req.body) {

        const { activity_id, chosenCategory, cat_id, activity_name, time_start,
            time_end, end_early, prod_rating } = element

        /*try {
            var user_id = req.user_id
            const yesterday_task = await session.check_first_session(user_id, yesterdayStartRange, yesterdayEndRange)
            const today_first_task = await session.check_first_session(user_id, startRange, endRange)
            console.log("YESTERDAY TASK IS ", yesterday_task)
            console.log("TODAY FIRST TASK IS ", today_first_task)
            if (yesterday_task == 0 && today_first_task == 0) {
                // this session is start of a new streak
                console.log("this session is start of a new streak")
            } else if (yesterday_task > 0 && today_first_task == 0) {
                // this session extends an existing streak
                console.log("this session extends an existing streak")
            } else {
                // already did a session today, nothing to update
                console.log("already did a session today, nothing to update")
            }

        } catch (err) {
        }*/
        var user_stats = null;

        try {
            var user_id = req.user_id
            var result = await session.set_user_session(activity_id, chosenCategory, cat_id, activity_name,
                time_start, time_end, end_early, prod_rating, user_id)
            console.log(result)
            if (!result) {
                return res.status(422).send({ error: "Error saving session!" });
            }
        } catch (err) {
            console.log("error saving this session!", err)
            return res.status(422).send({ error: "Error saving session!" });
        }

        // update stats to check for achievements
        /*try {
            user_stats = await user.getStatsFromId(id)
        } catch (err) {
            console.log("error getting user stats after session save")
        }*/
    }
    // all sessions successfully saved
    return res.status(200).send({ msg: "Success!" });
});

router.delete('/session/:id', async (req, res) => {
    const user_id = req.user_id
    const sessionId = req.params.id
    try {
        await session.deleteSession(user_id, sessionId)
        res.status(200).send()
    } catch (err) {
        console.log("Problem deleting session: ", err)
        res.status(403).send({ error: "Error deleting session!" })
    }
})

router.patch('/session/:id', async (req, res) => {
    const sessionId = req.params.id
    const user_id = req.user_id
    const { notes } = req.body
    console.log("Updating sessionId with notes ", notes)
    try {
        await session.updateNotes(notes, sessionId)
        res.status(200).send()
    } catch (err) {
        console.log(err.stack)
        res.status(403).send({ error: "Error patching session!" })
    }
})

module.exports = router;