const { rows } = require('pg/lib/defaults')
const db = require('../db')

async function setUpViews(userId) {
    //get uncleaned list of users who've interacted with self user
    friendEventsWithUserQuery = `CREATE OR REPLACE VIEW friendEventsWithUser AS(\
        select friend_a, friend_b, status_id,\
        CONCAT(LEAST(friend_a,friend_b),GREATEST(friend_a,friend_b)) as combined, time_created \
        from friend_event where friend_b = '${userId}' \
        UNION ALL \
        select friend_a, friend_b, status_id, \
        CONCAT(LEAST(friend_a,friend_b),GREATEST(friend_a,friend_b)) as combined, time_created \
        from friend_event where friend_a = '${userId}'\
        );`
    await db.query(friendEventsWithUserQuery)

    // get the latest status of each pair combination involving user (intermediate step)
    latestEventIntermediateQuery = `CREATE OR REPLACE VIEW latestEventWithUser as (\
        select CONCAT(LEAST(friend_a,friend_b),GREATEST(friend_a,friend_b)) as combined_inner, \
        (array_agg(status_id ORDER BY time_created desc))[0:1],
        (array_agg(time_created ORDER BY time_created desc))[0:1] as latestTime \
        from \
        friend_event \
        where friend_a = '${userId}' or friend_b = '${userId}'\
        group by combined_inner );`
    await db.query(latestEventIntermediateQuery)

    // get all users who interacted with user with the latest status of each
    latestEventQuery = "CREATE OR REPLACE VIEW latestEvents as (\
        select a.*, b.array_agg, b.latestTime from friendEventsWithUser a, latestEventWithUser b \
        where a.combined = b.combined_inner and a.status_id = ANY(b.array_agg) and a.time_created = ANY(b.latestTime)\
        );"
    await db.query(latestEventQuery)
}

async function getFriends(userId) {
    // set up views
    await setUpViews(userId)

    // finally, get all users whose latest interaction is "friended (status id = 0)"
    currentFriendsQuery = "SELECT a.*, b.username as username_a, c.username as username_b\
     FROM latestEvents a, user_timeout b, user_timeout c where\
     status_id = '0' AND a.friend_a = b.user_id AND a.friend_b = c.user_id;"
    currentFriendsValues = []

    const res = await db.query(currentFriendsQuery, currentFriendsValues)


    // identify if friend is friend_a or friend_b:
    for (var i = 0; i < res.rows.length; i++) {
        if (res.rows[i]['friend_a'] == userId) {
            res.rows[i]['friend'] = res.rows[i]['friend_b']
            res.rows[i]['username'] = res.rows[i]['username_b']
        } else {
            res.rows[i]['friend'] = res.rows[i]['friend_a']
            res.rows[i]['username'] = res.rows[i]['username_a']
        }
    }

    return res.rows
}

async function getRequestsIncoming(userId) {
    await setUpViews(userId)
    incomingRequestsQuery = "SELECT a.friend_a, a.time_created, b.username FROM latestEvents a, user_timeout b where \
    a.friend_b = $1 AND a.friend_a = b.user_id AND status_id = 3;"
    incomingRequestsValues = [userId]

    const res = await db.query(incomingRequestsQuery, incomingRequestsValues)
    return res.rows
}

async function getRequestsOutgoing(userId) {
    //friend_a is requestor, friend_b is requestee
    await setUpViews(userId)
    outgoingRequestsQuery = "SELECT a.friend_b, a.time_created, b.username FROM latestEvents a, user_timeout b where \
    friend_a = $1 AND a.friend_b = b.user_id AND status_id = 3\
    ORDER BY a.time_created DESC;"
    outgoingRequestsValues = [userId]

    const res = await db.query(outgoingRequestsQuery, outgoingRequestsValues)
    return res.rows
}

async function acceptFriendRequest(userId, idToAccept) {
    acceptRequestQuery = "INSERT INTO friend_event(friend_a, friend_b, time_created, status_id)\
    VALUES($1,$2,$3,$4) RETURNING *; "
    acceptRequestValues = [userId, idToAccept, new Date(), 0]
    await db.query(acceptRequestQuery, acceptRequestValues)
}

async function rejectFriendRequest(userId, idToReject) {
    acceptRequestQuery = "INSERT INTO friend_event(friend_a, friend_b, time_created, status_id)\
    VALUES($1,$2,$3,$4) RETURNING *; "
    acceptRequestValues = [userId, idToReject, new Date(), 1]
    await db.query(acceptRequestQuery, acceptRequestValues)
}

async function requestFriend(userId, codeToRequest) {
    // friend_a is self
    // friend_b is codeToRequest user
    // status_id is 3 (for request)
    // time is now

    // need to check if requestor not blocked, already friends with requestee, or pending request already sent

    // get user_id of the code to request
    getRequesteeIdQuery = "SELECT user_id FROM user_timeout where friend_code = $1"
    getRequesteeIdValues = [codeToRequest]

    const res = await db.query(getRequesteeIdQuery, getRequesteeIdValues)
    let requesteeUserId = ''

    if (res.rows.length == 0) { // no user associated with this friend code
        return -1
    }

    requesteeUserId = res.rows[0]['user_id']

    if (!checkValidRequest(userId, requesteeUserId)) {
        return -2
    }

    addRequestFriendQuery = "INSERT INTO friend_event(friend_a, friend_b, time_created, status_id)\
     VALUES($1,$2,$3,$4) RETURNING *"

    addRequestFriendValues = [userId, requesteeUserId, new Date(), 3]

    await db.query(addRequestFriendQuery, addRequestFriendValues)

    return 1
}

async function checkValidRequest(requestorId, requesteeId) {
    await setUpViews(requestorId)

    checkValidQuery = `select * from latestEvents \
    where (friend_a = '${requesteeId}' and status_id != 1) \
    OR (friend_b = '${requesteeId}' and status_id != 1)`

    // if result returns anything that means we cant send a friend request because they are already requested,
    // already friends, or blocked.
    var result = await db.query(checkValidQuery)
    if (result.rows.length > 0) {
        return false;
    }
    return true;

}

// SQL QUERIES FOR FRIENDS

/*

//get uncleaned list of users who've interacted with #1
CREATE OR REPLACE VIEW tempb AS(
select friend_a, friend_b, status_id, 
CONCAT(LEAST(friend_a,friend_b),GREATEST(friend_a,friend_b)) as combined 
from friend_event where friend_b = '1' 
UNION ALL 
select friend_a, friend_b, status_id, 
CONCAT(LEAST(friend_a,friend_b),GREATEST(friend_a,friend_b)) as combined 
from friend_event where friend_a = '1'
);

// get the latest status of each pairing involving #1
CREATE OR REPLACE VIEW latest_status as (
select CONCAT(LEAST(friend_a,friend_b),GREATEST(friend_a,friend_b)) as combined_inner, 
(array_agg(status_id ORDER BY time_created desc))[0:1] 
from 
friend_event 
group by combined_inner
);

// get all users who interacted with #1 with the latest status of each
CREATE OR REPLACE VIEW latest_interactions2 as (
select a.*, b.array_agg from tempb a, latest_status b where a.combined = b.combined_inner and a.status_id = ANY(b.array_agg)
);

// get all users who are currently friends with #1
SELECT * FROM latest_interactions where status_id = '2';

*/

module.exports = {
    requestFriend, getRequestsIncoming,
    getRequestsOutgoing, acceptFriendRequest, rejectFriendRequest,
    getFriends,
}