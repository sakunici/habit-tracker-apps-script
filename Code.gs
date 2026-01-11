// ==================== CONFIGURATION ====================
const SHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';

// ==================== WEB APP FUNCTIONS ====================
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Habit Tracker Reward')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// ==================== USER FUNCTIONS ====================
function login(userId, password) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const usersSheet = ss.getSheetByName('Users');
    if (!usersSheet) {
      return { success: false, message: 'Users sheet not found.' };
    }
    
    const users = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === userId && users[i][3] === password) {
        return {
          success: true,
          user: {
            userId: users[i][0],
            name: users[i][1],
            role: users[i][2],
            totalPoints: parseInt(users[i][4]) || 0,
            avatar: users[i][5] || '👤'
          }
        };
      }
    }
    
    return { success: false, message: 'Wrong user or password' };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, message: error.toString() };
  }
}

function getUserInfo(userId) {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) return null;

  const users = usersSheet.getDataRange().getValues();
  
  for (let i = 1; i < users.length; i++) {
    if (users[i][0] === userId) {
      return {
        userId: users[i][0],
        name: users[i][1],
        role: users[i][2],
        totalPoints: parseInt(users[i][4]) || 0,
        avatar: users[i][5] || '👤'
      };
    }
  }
  return null;
}

function getAllChildren() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const usersSheet = ss.getSheetByName('Users');
  if (!usersSheet) return [];
  
  const users = usersSheet.getDataRange().getValues();
  const children = [];
  
  for (let i = 1; i < users.length; i++) {
    if (users[i][2] === 'child') {
      children.push({
        userId: users[i][0],
        name: users[i][1],
        totalPoints: parseInt(users[i][4]) || 0,
        avatar: users[i][5] || '👤'
      });
    }
  }
  return children;
}

// ==================== TASK FUNCTIONS ====================
function getTasks() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const tasksSheet = ss.getSheetByName('Tasks');
    if (!tasksSheet) return [];
    
    const tasks = tasksSheet.getDataRange().getValues();
    const taskList = [];
    
    for (let i = 1; i < tasks.length; i++) {
      taskList.push({
        taskId: tasks[i][0],
        taskName: tasks[i][1],
        points: parseInt(tasks[i][2]) || 0,
        category: tasks[i][3] || '',
        icon: tasks[i][4] || '📝'
      });
    }
    return taskList;
  } catch (error) {
    console.error('Get tasks error:', error);
    return [];
  }
}

// ==================== PENDING POINTS FUNCTIONS ====================
function requestPoints(userId, taskId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const tasksSheet = ss.getSheetByName('Tasks');
    if (!tasksSheet) return { success: false, message: 'Tasks sheet not found.' };
    
    const tasks = tasksSheet.getDataRange().getValues();
    
    let taskName = '';
    let taskPoints = 0;
    
    // Find task details
    for (let i = 1; i < tasks.length; i++) {
      if (tasks[i][0] === taskId) {
        taskName = tasks[i][1];
        taskPoints = parseInt(tasks[i][2]) || 0;
        break;
      }
    }


// ฟังก์ชันหักคะแนนโดย Admin - Admin point deduction function
function deductPoints(userId, points, reason) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const usersSheet = ss.getSheetByName('Users');
    const logSheet = ss.getSheetByName('PointsLog');
    const users = usersSheet.getDataRange().getValues();
    
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === userId) {
        let currentPoints = parseInt(users[i][4]) || 0;
        let newTotal = Math.max(0, currentPoints - points);
        usersSheet.getRange(i + 1, 5).setValue(newTotal);
        
        const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
        const logId = 'L' + new Date().getTime();
        logSheet.appendRow([logId, userId, 'DEDUCT', -points, timestamp, reason, 'COMPLETED']);
        return { success: true, newTotal: newTotal };
      }
    }
  } catch (e) { return { success: false, message: e.toString() }; }
}
    // Add to PointsLog with PENDING status
    const logSheet = ss.getSheetByName('PointsLog');
    if (!logSheet) return { success: false, message: 'PointsLog sheet not found.' };

    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
    const logId = 'L' + new Date().getTime();
    
    logSheet.appendRow([logId, userId, taskId, taskPoints, timestamp, taskName, 'PENDING']);
    
    console.log('Points requested:', logId, userId, taskName, taskPoints);
    
    return { success: true, message: 'Points request sent! Waiting for Mom approval.' };
  } catch (error) {
    console.error('Request points error:', error);
    return { success: false, message: error.toString() };
  }
}

function getPendingRequests() {
  console.log('getPendingRequests called');
  
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const logSheet = ss.getSheetByName('PointsLog');
    const usersSheet = ss.getSheetByName('Users');
    
    if (!logSheet || !usersSheet) {
      console.error('Required sheets not found');
      return [];
    }
    
    const logData = logSheet.getDataRange().getValues();
    const userData = usersSheet.getDataRange().getValues();
    
    // สร้าง Map ของ User data เพื่อความรวดเร็วในการค้นหา - Create a map of user data for faster searching.
    const userMap = {};
    for (let j = 1; j < userData.length; j++) {
      userMap[userData[j][0]] = {
        name: userData[j][1] || 'Unknown',
        avatar: userData[j][5] || '👤'
      };
    }

    const pending = [];
    
    // Loop through log data (skip header row)
    for (let i = 1; i < logData.length; i++) {
      const row = logData[i];
      
      // Check if Status column (index 6) is "PENDING"
      if (row[6] && row[6].toString().trim() === 'PENDING') {
        
        const userId = row[1];
        const userInfo = userMap[userId] || { userName: 'Unknown', userAvatar: '👤' };
        
        const pendingItem = {
          rowIndex: i + 1, // Row number in sheet (1-indexed)
          logId: row[0] || '',
          userId: userId || '',
          userName: userInfo.name,
          userAvatar: userInfo.avatar,
          taskName: row[5] || 'Task',
          points: parseInt(row[3]) || 0,
          date: row[4] ? row[4].toString() : ''
        };
        
        pending.push(pendingItem);
      }
    }
    
    return pending;
    
  } catch (error) {
    console.error('Error in getPendingRequests:', error.toString());
    return [];
  }
}

function approvePoints(rowIndex, userId, points) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const logSheet = ss.getSheetByName('PointsLog');
    const usersSheet = ss.getSheetByName('Users');
    
    if (!logSheet || !usersSheet) return { success: false, message: 'Sheet not found.' };

    // 1. Update status to APPROVED
    logSheet.getRange(rowIndex, 7).setValue('APPROVED');
    
    // 2. Update user's total points
    const users = usersSheet.getDataRange().getValues();
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === userId) {
        const currentPoints = parseInt(users[i][4]) || 0;
        const newPoints = currentPoints + points;
        usersSheet.getRange(i + 1, 5).setValue(newPoints);
        console.log(`Updated ${userId} points from ${currentPoints} to ${newPoints}`);
        break;
      }
    }
    
    return { success: true, message: 'Points approved!' };
  } catch (error) {
    console.error('Approve error:', error);
    return { success: false, message: error.toString() };
  }
}

function rejectPoints(rowIndex) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const logSheet = ss.getSheetByName('PointsLog');
    
    if (!logSheet) return { success: false, message: 'PointsLog sheet not found.' };

    // Update status to REJECTED
    logSheet.getRange(rowIndex, 7).setValue('REJECTED');
    
    return { success: true, message: 'Points request rejected.' };
  } catch (error) {
    console.error('Reject error:', error);
    return { success: false, message: error.toString() };
  }
}

// ==================== ADMIN FUNCTIONS ====================
function deductPoints(userId, points, reason) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const usersSheet = ss.getSheetByName('Users');
    const logSheet = ss.getSheetByName('PointsLog');
    
    if (!usersSheet || !logSheet) return { success: false, message: 'Sheet not found.' };

    const users = usersSheet.getDataRange().getValues();
    
    // Update user's total points
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === userId) {
        const currentPoints = parseInt(users[i][4]) || 0;
        const newPoints = Math.max(0, currentPoints - points); 
        usersSheet.getRange(i + 1, 5).setValue(newPoints);
        
        // Add to log
        const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
        const logId = 'L' + new Date().getTime();
        logSheet.appendRow([logId, userId, 'DEDUCT', -points, timestamp, reason || 'Points deducted by Mom', 'COMPLETED']);
        
        return { success: true, newTotal: newPoints };
      }
    }
    return { success: false, message: 'User not found' };
  } catch (error) {
    console.error('Deduct points error:', error);
    return { success: false, message: error.toString() };
  }
}

/**
 * Approves multiple pending points requests and updates user scores.
 * @param {number[]} rowIndexes - An array of row numbers from the PointsLog sheet to be approved.
 * @returns {object} An object indicating the success status and a message.
 */
function approveMultiplePoints(rowIndexes) {
    try {
        if (!Array.isArray(rowIndexes) || rowIndexes.length === 0) {
            return { success: false, message: 'No requests selected for approval.' };
        }
        
        const ss = SpreadsheetApp.openById(SHEET_ID);
        const logSheet = ss.getSheetByName('PointsLog');
        const usersSheet = ss.getSheetByName('Users');

        if (!logSheet || !usersSheet) {
            return { success: false, message: 'Required sheets not found.' };
        }
        
        // ดึงข้อมูลที่จำเป็นเพียงครั้งเดียว - Retrieve the necessary data only once.
        const logData = logSheet.getDataRange().getValues();
        const userData = usersSheet.getDataRange().getValues();
        
        // 1. สร้าง Map เพื่อเก็บข้อมูลผู้ใช้และคะแนนปัจจุบัน (สำหรับอัปเดต) - Create a map to store user data and current scores (for updates).
        const userUpdates = {};
        for (let i = 1; i < userData.length; i++) {
            userUpdates[userData[i][0]] = {
                row: i + 1,
                newPoints: parseInt(userData[i][4]) || 0
            };
        }

        let approvedCount = 0;
        
        // 2. ประมวลผลและคำนวณคะแนนที่เพิ่มขึ้น และอัปเดตสถานะใน PointsLog - Process and calculate the increased points, and update the status in the PointsLog
        for (const rowIndex of rowIndexes) {
            const logRowIndex = rowIndex - 1;
            
            if (rowIndex > 1 && logRowIndex < logData.length) {
                const rowData = logData[logRowIndex];
                const userId = rowData[1];
                const points = parseInt(rowData[3]) || 0;
                const status = rowData[6];

                if (status === 'PENDING' && userUpdates[userId]) {
                    // อัปเดตสถานะ (ใช้ setValue ทีละครั้ง ไม่ดีเท่า setValues แต่เป็นทางออกที่ง่ายกว่า)-Update status (using `setValue` one at a time is not as good as `setValues`, but it's a simpler solution).
                    logSheet.getRange(rowIndex, 7).setValue('APPROVED'); 
                    
                    // รวบรวมการอัปเดตคะแนน - Total score updates
                    userUpdates[userId].newPoints += points;
                    approvedCount++;
                }
            }
        }

        // 3. อัปเดตคะแนนในชีต Users เพียงครั้งเดียวสำหรับผู้ใช้แต่ละคนที่มีการเปลี่ยนแปลง - Update the scores in the Users sheet only once for each user whose score has changed
        for (const userId in userUpdates) {
            const userRow = userUpdates[userId].row;
            const finalPoints = userUpdates[userId].newPoints;
            
            usersSheet.getRange(userRow, 5).setValue(finalPoints);
        }
        
        return { success: true, message: `Approved ${approvedCount} requests successfully.` };
    } catch (error) {
        console.error('Bulk approve error:', error);
        return { success: false, message: error.toString() };
    }
}


// ==================== REWARD FUNCTIONS ====================
function getRewards() {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const rewardsSheet = ss.getSheetByName('Rewards');
    if (!rewardsSheet) return [];

    const rewards = rewardsSheet.getDataRange().getValues();
    const rewardList = [];
    
    for (let i = 1; i < rewards.length; i++) {
      if (rewards[i][4] === 'active') {
        rewardList.push({
          rewardId: rewards[i][0],
          rewardName: rewards[i][1],
          requiredPoints: parseInt(rewards[i][2]) || 0,
          icon: rewards[i][3] || '🎁'
        });
      }
    }
    return rewardList;
  } catch (error) {
    console.error('Get rewards error:', error);
    return [];
  }
}

function claimReward(userId, rewardId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const rewardsSheet = ss.getSheetByName('Rewards');
    const usersSheet = ss.getSheetByName('Users');
    
    if (!rewardsSheet || !usersSheet) return { success: false, message: 'Sheet not found.' };

    // Get reward info
    const rewards = rewardsSheet.getDataRange().getValues();
    let requiredPoints = 0;
    let rewardName = '';
    
    for (let i = 1; i < rewards.length; i++) {
      if (rewards[i][0] === rewardId) {
        requiredPoints = parseInt(rewards[i][2]) || 0;
        rewardName = rewards[i][1];
        break;
      }
    }
    
    // Check and update user points
    const users = usersSheet.getDataRange().getValues();
    for (let i = 1; i < users.length; i++) {
      if (users[i][0] === userId) {
        const currentPoints = parseInt(users[i][4]) || 0;
        
        if (currentPoints >= requiredPoints) {
          const newPoints = currentPoints - requiredPoints;
          usersSheet.getRange(i + 1, 5).setValue(newPoints);
          
          // Log
          const logSheet = ss.getSheetByName('PointsLog');
          const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
          const logId = 'L' + new Date().getTime();
          logSheet.appendRow([logId, userId, 'REWARD', -requiredPoints, timestamp, 'Claimed: ' + rewardName, 'COMPLETED']);
          
          return { success: true, message: 'Reward claimed successfully!', newTotal: newPoints };
        } else {
          return { success: false, message: `Need ${requiredPoints - currentPoints} more points` };
        }
      }
    }
  } catch (error) {
    console.error('Claim reward error:', error);
    return { success: false, message: error.toString() };
  }
}

function getPointsHistory(userId) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const logSheet = ss.getSheetByName('PointsLog');
    if (!logSheet) return [];

    const logs = logSheet.getDataRange().getValues();
    const history = [];
    
    for (let i = 1; i < logs.length; i++) {
      // Check if this log belongs to the user and is not pending/rejected
      if (logs[i][1] === userId) {
        const status = logs[i][6] || 'COMPLETED';
        if (status !== 'PENDING' && status !== 'REJECTED') {
          history.push({
            points: parseInt(logs[i][3]) || 0,
            date: logs[i][4],
            note: logs[i][5] || 'Task',
            status: status
          });
        }
      }
    }
    
    // Get last 10 records
    return history.slice(-10).reverse();
  } catch (error) {
    console.error('Get history error:', error);
    return [];
  }
}

// ฟังก์ชันสำหรับส่งคำขอหลาย Task พร้อมกัน - A function for sending multiple task requests simultaneously.
function requestMultipleTasks(userId, taskIds) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const tasksSheet = ss.getSheetByName('Tasks');
    const logSheet = ss.getSheetByName('PointsLog');
    const tasks = tasksSheet.getDataRange().getValues();
    const timestamp = Utilities.formatDate(new Date(), 'GMT+7', 'yyyy-MM-dd HH:mm:ss');
    
    taskIds.forEach(taskId => {
      let taskName = '';
      let taskPoints = 0;
      for (let i = 1; i < tasks.length; i++) {
        if (tasks[i][0] === taskId) {
          taskName = tasks[i][1];
          taskPoints = parseInt(tasks[i][2]) || 0;
          break;
        }
      }
      const logId = 'L' + new Date().getTime() + Math.floor(Math.random() * 1000);
      logSheet.appendRow([logId, userId, taskId, taskPoints, timestamp, taskName, 'PENDING']);
    });
    return { success: true, message: 'All requested have been saved!' };
  } catch (e) { return { success: false, message: e.toString() }; }
}
