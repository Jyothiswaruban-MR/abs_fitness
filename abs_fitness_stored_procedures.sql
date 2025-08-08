-- AUTH Stored Procedures

-- 1. Authenticate User (simplified example, adapt as needed)
CREATE PROCEDURE sp_AuthenticateUser
  @Email VARCHAR(50)
AS
BEGIN
  SELECT id, username, email, password FROM users WHERE email = @Email;
END
GO

-- 2. Register User
CREATE PROCEDURE sp_RegisterUser
  @Username VARCHAR(50),
  @Email VARCHAR(50),
  @Age INT,
  @Password VARCHAR(255)
AS
BEGIN
  INSERT INTO users (username, email, age, password)
  VALUES (@Username, @Email, @Age, @Password);
  SELECT SCOPE_IDENTITY() AS userId;
END
GO

-- 3. Log User Activity
CREATE PROCEDURE sp_LogUserActivity
  @userId INT,
  @token VARCHAR(255),
  @tokenType VARCHAR(20),
  @tokenExpiry DATETIME = NULL,
  @activityType VARCHAR(100),
  @activityDescription VARCHAR(100),
  @activityTimestamp DATETIME,
  @ipAddress VARCHAR(60)
AS
BEGIN
  INSERT INTO userActivity
  (userId, token, tokenType, tokenExpiry, activityType, activityDescription, activityTimestamp, ipAddress)
  VALUES
  (@userId, @token, @tokenType, @tokenExpiry, @activityType, @activityDescription, @activityTimestamp, @ipAddress);
END
GO

-- WORKOUTS Stored Procedures

CREATE PROCEDURE sp_AddWorkout
  @userId INT,
  @workoutType VARCHAR(255),
  @duration INT,
  @calories INT,
  @notes VARCHAR(255) = NULL,
  @workout_date DATE
AS
BEGIN
  INSERT INTO workouts (userId, workoutType, duration, calories, notes, workout_date)
  VALUES (@userId, @workoutType, @duration, @calories, @notes, @workout_date);
END
GO

CREATE PROCEDURE sp_GetAllWorkouts
  @userId INT
AS
BEGIN
  SELECT * FROM workouts WHERE userId = @userId ORDER BY workout_date DESC;
END
GO

CREATE PROCEDURE sp_GetWorkoutById
  @userId INT,
  @id INT
AS
BEGIN
  SELECT * FROM workouts WHERE id = @id AND userId = @userId;
END
GO

CREATE PROCEDURE sp_UpdateWorkout
  @id INT,
  @userId INT,
  @workoutType VARCHAR(255),
  @duration INT,
  @calories INT,
  @notes VARCHAR(255) = NULL,
  @workout_date DATE
AS
BEGIN
  UPDATE workouts
  SET workoutType = @workoutType,
      duration = @duration,
      calories = @calories,
      notes = @notes,
      workout_date = @workout_date
  WHERE id = @id AND userId = @userId;
END
GO

CREATE PROCEDURE sp_DeleteWorkout
  @id INT,
  @userId INT
AS
BEGIN
  DELETE FROM workouts WHERE id = @id AND userId = @userId;
END
GO

-- GOALS Stored Procedures

-- Add Goal (status defaults to 'active')
CREATE PROCEDURE sp_AddGoal
  @userId INT,
  @description VARCHAR(255),
  @target_date DATE
AS
BEGIN
  INSERT INTO goals (userId, description, target_date, status)
  VALUES (@userId, @description, @target_date, 'active');
END
GO

-- Get All Goals for a User (sorted by target date)
CREATE PROCEDURE sp_GetAllGoals
  @userId INT
AS
BEGIN
  SELECT * FROM goals
  WHERE userId = @userId
  ORDER BY target_date ASC;
END
GO

-- Get Goal by ID
CREATE PROCEDURE sp_GetGoalById
  @id INT,
  @userId INT
AS
BEGIN
  SELECT * FROM goals
  WHERE id = @id AND userId = @userId;
END
GO

-- Update Goal by ID
CREATE PROCEDURE sp_UpdateGoal
  @id INT,
  @userId INT,
  @description VARCHAR(255),
  @target_date DATE,
  @status VARCHAR(20)
AS
BEGIN
  UPDATE goals
  SET description = @description,
      target_date = @target_date,
      status = @status
  WHERE id = @id AND userId = @userId;
END
GO

-- Delete Goal by ID
CREATE PROCEDURE sp_DeleteGoal
  @id INT,
  @userId INT
AS
BEGIN
  DELETE FROM goals
  WHERE id = @id AND userId = @userId;
END
GO

-- USERPROFILES Stored Procedures

CREATE PROCEDURE sp_CreateUserProfile
  @userId INT,
  @age INT = NULL,
  @gender VARCHAR(10) = NULL,
  @height_cm FLOAT = NULL,
  @weight_kg FLOAT = NULL
AS
BEGIN
  INSERT INTO userProfiles (userId, age, gender, height_cm, weight_kg, createdAt, updatedAt)
  VALUES (@userId, @age, @gender, @height_cm, @weight_kg, GETDATE(), GETDATE());
END
GO

CREATE PROCEDURE sp_GetUserProfile
  @userId INT
AS
BEGIN
  SELECT userId, age, gender, height_cm, weight_kg, createdAt, updatedAt
  FROM userProfiles
  WHERE userId = @userId;
END
GO

CREATE PROCEDURE sp_UpdateUserProfile
  @userId INT,
  @age INT = NULL,
  @gender VARCHAR(10) = NULL,
  @height_cm FLOAT = NULL,
  @weight_kg FLOAT = NULL
AS
BEGIN
  UPDATE userProfiles
  SET age = @age,
      gender = @gender,
      height_cm = @height_cm,
      weight_kg = @weight_kg,
      updatedAt = GETDATE()
  WHERE userId = @userId;
END
GO

/* -- DASHBOARD Stored Procedure

CREATE PROCEDURE sp_GetDashboardData
  @userId INT
AS
BEGIN
  -- Total workouts
  SELECT COUNT(*) AS totalWorkouts
  FROM workouts
  WHERE userId = @userId;

  -- Total calories burned
  SELECT ISNULL(SUM(calories), 0) AS totalCalories
  FROM workouts
  WHERE userId = @userId;

  -- Weekly progress for past 4 weeks
  SELECT 
    DATEADD(WEEK, DATEDIFF(WEEK, 0, workout_date), 0) AS weekStart,
    COUNT(*) AS workouts,
    SUM(calories) AS calories
  FROM workouts
  WHERE userId = @userId
    AND workout_date >= DATEADD(WEEK, -4, GETDATE())
  GROUP BY DATEADD(WEEK, DATEDIFF(WEEK, 0, workout_date), 0)
  ORDER BY weekStart ASC;
END
GO */

-- DASHBOARD: Combined User Dashboard Procedure
CREATE PROCEDURE sp_GetUserDashboard
  @userId INT
AS
BEGIN
  -- 1. Total workouts
  SELECT COUNT(*) AS totalWorkouts
  FROM workouts
  WHERE userId = @userId;

  -- 2. Total calories burned
  SELECT ISNULL(SUM(calories), 0) AS totalCalories
  FROM workouts
  WHERE userId = @userId;

  -- 3. Weekly progress
  SELECT 
    FORMAT(workout_date, 'yyyy-MM-dd') AS weekStart,
    COUNT(*) AS workouts,
    SUM(calories) AS calories
  FROM workouts
  WHERE userId = @userId
    AND workout_date >= DATEADD(DAY, -7, GETDATE())
  GROUP BY FORMAT(workout_date, 'yyyy-MM-dd')
  ORDER BY weekStart;

  -- 4. Active goals count
  SELECT COUNT(*) AS activeGoals
  FROM goals
  WHERE userId = @userId AND ISNULL(status, 'active') = 'active';

  -- 5. Basic user info
  SELECT username, first_name
  FROM users
  WHERE id = @userId;

  -- 6. Active goals (for listing current and upcoming)
  SELECT id, description, target_date, status
  FROM goals
  WHERE userId = @userId AND ISNULL(status, 'active') = 'active'
  ORDER BY target_date ASC;
END
GO
