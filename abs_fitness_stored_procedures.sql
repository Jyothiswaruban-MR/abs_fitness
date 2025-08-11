-- AUTH Stored Procedures
--1.AddGoal
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_AddGoal]    Script Date: 10/08/2025 21:42:14 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_AddGoal]
  @userId INT,
  @description VARCHAR(255),
  @target_date DATE
AS
BEGIN
  INSERT INTO goals (userId, description, target_date)
  VALUES (@userId, @description, @target_date);
END;

--2. Workout
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_AddWorkout]    Script Date: 11/08/2025 10:43:12 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
--3. Authenticate User
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_AuthenticateUser]    Script Date: 11/08/2025 10:44:03 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_AuthenticateUser]
  @Email VARCHAR(50)
AS
BEGIN
  SELECT * FROM users WHERE email = @Email
END
--4. Create User profile
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_CreateUserProfile]    Script Date: 11/08/2025 10:44:46 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
-- Create user profile
ALTER PROCEDURE [dbo].[sp_CreateUserProfile]
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
--5.Delete Goal
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_DeleteGoal]    Script Date: 11/08/2025 10:45:12 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_DeleteGoal]
  @userId INT,
  @id INT
AS
BEGIN
  DELETE FROM goals WHERE id = @id AND userId = @userId;
END;
--6.Delete Workout
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_DeleteWorkout]    Script Date: 11/08/2025 10:45:43 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 5. Delete workout
ALTER PROCEDURE [dbo].[sp_DeleteWorkout]
  @id INT,
  @userId INT
AS
BEGIN
  DELETE FROM workouts WHERE id = @id AND userId = @userId;
END

--7.Get All Goals
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetAllGoals]    Script Date: 11/08/2025 10:46:22 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_GetAllGoals]
  @userId INT
AS
BEGIN
  SELECT * FROM goals WHERE userId = @userId ORDER BY target_date ASC;
END;

--8. Get All Workouts
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetAllWorkouts]    Script Date: 11/08/2025 10:47:06 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 2. Get all workouts for a user
ALTER PROCEDURE [dbo].[sp_GetAllWorkouts]
  @userId INT
AS
BEGIN
  SELECT * FROM workouts WHERE userId = @userId ORDER BY workout_date DESC;
END

--9. Get Goal ById
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetGoalById]    Script Date: 11/08/2025 10:47:48 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_GetGoalById]
  @userId INT,
  @id INT
AS
BEGIN
  SELECT * FROM goals WHERE id = @id AND userId = @userId;
END;

--10. Get User Dashboard
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetUserDashboard]    Script Date: 11/08/2025 10:48:09 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_GetUserDashboard]
  @userId INT
AS
BEGIN
  -- 1. User info (Recordset 0)
  SELECT username, first_name
  FROM users
  WHERE id = @userId;

  -- 2. Total workouts (Recordset 1)
  SELECT COUNT(*) AS totalWorkouts
  FROM workouts
  WHERE userId = @userId;

  -- 3. Total calories (Recordset 2)
  SELECT ISNULL(SUM(calories), 0) AS totalCalories
  FROM workouts
  WHERE userId = @userId;

  -- 4. Weekly progress (Recordset 3)
  SELECT 
    CONVERT(VARCHAR(10), workout_date, 120) AS day,
    ISNULL(SUM(calories), 0) AS calories
  FROM workouts
  WHERE userId = @userId
    AND workout_date >= DATEADD(DAY, -7, GETDATE())
  GROUP BY CONVERT(VARCHAR(10), workout_date, 120)
  ORDER BY day;

  -- 5. Weekly workout frequency (Recordset 4)
  ;WITH daysOfWeek AS (
    SELECT 0 AS dayNum, 'Sun' AS dayName UNION ALL
    SELECT 1, 'Mon' UNION ALL SELECT 2, 'Tue' UNION ALL
    SELECT 3, 'Wed' UNION ALL SELECT 4, 'Thu' UNION ALL
    SELECT 5, 'Fri' UNION ALL SELECT 6, 'Sat'
  )
  SELECT 
    d.dayName AS weekday,
    COUNT(w.id) AS count
  FROM daysOfWeek d
  LEFT JOIN workouts w ON 
    DATEPART(WEEKDAY, w.workout_date) = d.dayNum + 1
    AND w.userId = @userId
    AND w.workout_date >= DATEADD(DAY, -7, GETDATE())
  GROUP BY d.dayNum, d.dayName
  ORDER BY d.dayNum;

  -- 6. Goal completion stats (Recordset 5)
  SELECT
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS inProgress,
    SUM(CASE WHEN status IS NULL OR status = 'not_started' THEN 1 ELSE 0 END) AS notStarted
  FROM goals
  WHERE userId = @userId;
END
--11. GetUser Profile
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetUserProfile]    Script Date: 11/08/2025 10:48:36 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- Get user profile
ALTER PROCEDURE [dbo].[sp_GetUserProfile]
  @userId INT
AS
BEGIN
  SELECT userId, age, gender, height_cm, weight_kg, createdAt, updatedAt
  FROM userProfiles
  WHERE userId = @userId;
END

--12. Get workout ById
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_GetWorkoutById]    Script Date: 11/08/2025 10:50:21 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 3. Get workout by ID
ALTER PROCEDURE [dbo].[sp_GetWorkoutById]
  @userId INT,
  @id INT
AS
BEGIN
  SELECT * FROM workouts WHERE id = @id AND userId = @userId;
END

--13. Log User Activity
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_LogUserActivity]    Script Date: 11/08/2025 10:50:35 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_LogUserActivity]
  @userId INT,
  @token VARCHAR(255),
  @tokenType VARCHAR(20),
  @tokenExpiry DATETIME,
  @activityType VARCHAR(100),
  @activityDescription VARCHAR(100),
  @activityTimestamp DATETIME,
  @ipAddress VARCHAR(60)
AS
BEGIN
  INSERT INTO userActivity 
  (userId, token, tokenType, tokenExpiry, activityType, activityDescription, activityTimestamp, ipAddress)
  VALUES 
  (@userId, @token, @tokenType, @tokenExpiry, @activityType, @activityDescription, @activityTimestamp, @ipAddress)
END

--14. Register User
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_RegisterUser]    Script Date: 11/08/2025 10:50:56 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_RegisterUser]
  @firstName VARCHAR(100),
  @lastName VARCHAR(100),
  @username VARCHAR(50),
  @phone VARCHAR(30),
  @gender VARCHAR(20),
  @age INT = NULL,
  @height_cm DECIMAL(6,2) = NULL,
  @weight_kg DECIMAL(6,2) = NULL,
  @email VARCHAR(255),
  @password VARCHAR(255), -- hashed password
  @userId INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  -- Check duplicates
  IF EXISTS (SELECT 1 FROM Users WHERE email = @email)
  BEGIN
    SET @userId = NULL;
    RETURN;
  END
  IF EXISTS (SELECT 1 FROM Users WHERE username = @username)
  BEGIN
    SET @userId = NULL;
    RETURN;
  END

  INSERT INTO Users
    (first_name, last_name, username, phone, gender, age, height_cm, weight_kg, email, password, createdAt)
  VALUES
    (@firstName, @lastName, @username, @phone, @gender, @age, @height_cm, @weight_kg, @email, @password, GETDATE());

  SET @userId = SCOPE_IDENTITY();
END

--15. Update Goal
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_RegisterUser]    Script Date: 11/08/2025 10:50:56 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_RegisterUser]
  @firstName VARCHAR(100),
  @lastName VARCHAR(100),
  @username VARCHAR(50),
  @phone VARCHAR(30),
  @gender VARCHAR(20),
  @age INT = NULL,
  @height_cm DECIMAL(6,2) = NULL,
  @weight_kg DECIMAL(6,2) = NULL,
  @email VARCHAR(255),
  @password VARCHAR(255), -- hashed password
  @userId INT OUTPUT
AS
BEGIN
  SET NOCOUNT ON;

  -- Check duplicates
  IF EXISTS (SELECT 1 FROM Users WHERE email = @email)
  BEGIN
    SET @userId = NULL;
    RETURN;
  END
  IF EXISTS (SELECT 1 FROM Users WHERE username = @username)
  BEGIN
    SET @userId = NULL;
    RETURN;
  END

  INSERT INTO Users
    (first_name, last_name, username, phone, gender, age, height_cm, weight_kg, email, password, createdAt)
  VALUES
    (@firstName, @lastName, @username, @phone, @gender, @age, @height_cm, @weight_kg, @email, @password, GETDATE());

  SET @userId = SCOPE_IDENTITY();
END

--16. Update User Profile
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_UpdateUserProfile]    Script Date: 11/08/2025 10:51:38 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
ALTER PROCEDURE [dbo].[sp_UpdateUserProfile]
  @userId INT,
  @age INT = NULL,
  @gender VARCHAR(10) = NULL,
  @height_cm FLOAT = NULL,
  @weight_kg FLOAT = NULL
AS
BEGIN
  SET NOCOUNT ON;
  
  BEGIN TRY
    BEGIN TRANSACTION;
    
    -- Update or insert profile information
    IF EXISTS (SELECT 1 FROM userProfiles WHERE userId = @userId)
    BEGIN
      UPDATE userProfiles
      SET 
        age = ISNULL(@age, age),
        gender = ISNULL(@gender, gender),
        height_cm = ISNULL(@height_cm, height_cm),
        weight_kg = ISNULL(@weight_kg, weight_kg)
      WHERE 
        userId = @userId;
    END
    ELSE
    BEGIN
      INSERT INTO userProfiles (userId, age, gender, height_cm, weight_kg)
      VALUES (@userId, @age, @gender, @height_cm, @weight_kg);
    END
    
    COMMIT TRANSACTION;
  END TRY
  BEGIN CATCH
    IF @@TRANCOUNT > 0
      ROLLBACK TRANSACTION;
    
    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    
    RAISERROR(@ErrorMessage, @ErrorSeverity, 1);
  END CATCH
END
--17. Update Workout
USE [ABS_FITNESS]
GO
/****** Object:  StoredProcedure [dbo].[sp_UpdateWorkout]    Script Date: 11/08/2025 10:52:02 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

-- 4. Update workout
ALTER PROCEDURE [dbo].[sp_UpdateWorkout]
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
