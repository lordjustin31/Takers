@echo off
echo ========================================
echo K6 MARKETPLACE TEST SUITE
echo ========================================
echo.

echo [1/5] Running Basic Load Test...
k6 run load-test-basic.js
echo.
echo ----------------------------------------
echo.

echo [2/5] Running Authentication Test...
k6 run load-test-auth.js
echo.
echo ----------------------------------------
echo.

echo [3/5] Running Rate Limit Test...
k6 run rate-limit-test.js
echo.
echo ----------------------------------------
echo.

echo [4/5] Running Stress Test...
k6 run stress-test.js
echo.
echo ----------------------------------------
echo.

echo [5/5] Running Spike Test...
k6 run spike-test.js
echo.
echo ----------------------------------------
echo.

echo ========================================
echo ALL TESTS COMPLETE!
echo ========================================
echo Check the generated JSON files for detailed results.
echo.
pause
