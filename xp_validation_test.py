#!/usr/bin/env python3

import requests
import json

def test_badge_verification():
    """Test that the user has the expected badges"""
    base_url = "https://f4904d02-45cf-4af2-bac8-acdcf84269d3.preview.emergentagent.com/api"
    test_wallet = "0x413cd446676a75a536d15fa6c7396013e7809017"
    
    print("🏅 Testing Badge System...")
    
    # Get current user stats
    response = requests.get(f"{base_url}/xp/stats/{test_wallet}")
    data = response.json()
    
    if not data.get("success"):
        print("❌ Failed to get user stats")
        return False
    
    user_data = data["data"]
    badges = user_data.get("badges", [])
    
    print(f"Current badges: {badges}")
    print(f"Current XP: {user_data.get('xp')}")
    print(f"Current Level: {user_data.get('level')}")
    print(f"Current Streak: {user_data.get('currentStreak')}")
    
    # Expected badges based on context
    expected_badges = ["first_bet", "first_win"]
    
    # Check if user has streak badge (should have it with 4+ wins)
    if user_data.get("currentStreak", 0) >= 3:
        expected_badges.append("streak_3")
    
    missing_badges = []
    for badge in expected_badges:
        if badge not in badges:
            missing_badges.append(badge)
    
    if missing_badges:
        print(f"❌ Missing expected badges: {missing_badges}")
        return False
    else:
        print(f"✅ All expected badges present: {expected_badges}")
        return True

def test_level_progression():
    """Test level progression logic"""
    print("\n📈 Testing Level Progression...")
    
    # Test cases: (XP, Expected Level)
    test_cases = [
        (0, 1),
        (60, 1),    # Current user XP from context
        (100, 2),   # Level 2 threshold
        (400, 3),   # Level 3 threshold
        (900, 4),   # Level 4 threshold
    ]
    
    all_correct = True
    for xp, expected_level in test_cases:
        calculated_level = int((xp / 100) ** 0.5) + 1
        if calculated_level == expected_level:
            print(f"✅ {xp} XP → Level {calculated_level}")
        else:
            print(f"❌ {xp} XP → Level {calculated_level}, expected {expected_level}")
            all_correct = False
    
    return all_correct

def test_xp_progress_calculation():
    """Test XP progress calculation"""
    print("\n📊 Testing XP Progress Calculation...")
    
    base_url = "https://f4904d02-45cf-4af2-bac8-acdcf84269d3.preview.emergentagent.com/api"
    test_wallet = "0x413cd446676a75a536d15fa6c7396013e7809017"
    
    response = requests.get(f"{base_url}/xp/stats/{test_wallet}")
    data = response.json()
    
    if not data.get("success"):
        print("❌ Failed to get user stats")
        return False
    
    user_data = data["data"]
    xp = user_data.get("xp", 0)
    level = user_data.get("level", 1)
    xp_progress = user_data.get("xpProgress", {})
    
    # Calculate expected values
    current_level_xp = (level - 1) * (level - 1) * 100
    next_level_xp = level * level * 100
    expected_current = xp - current_level_xp
    expected_needed = next_level_xp - current_level_xp
    expected_percentage = (expected_current / expected_needed) * 100 if expected_needed > 0 else 100
    
    print(f"XP: {xp}, Level: {level}")
    print(f"Current level XP: {current_level_xp}, Next level XP: {next_level_xp}")
    print(f"Progress - Current: {xp_progress.get('current')}, Needed: {xp_progress.get('needed')}, Percentage: {xp_progress.get('percentage'):.1f}%")
    print(f"Expected - Current: {expected_current}, Needed: {expected_needed}, Percentage: {expected_percentage:.1f}%")
    
    # Validate calculations
    if (xp_progress.get("current") == expected_current and 
        xp_progress.get("needed") == expected_needed and 
        abs(xp_progress.get("percentage", 0) - expected_percentage) < 1):
        print("✅ XP progress calculation is correct")
        return True
    else:
        print("❌ XP progress calculation is incorrect")
        return False

if __name__ == "__main__":
    print("🧪 Running Additional XP System Validation Tests...")
    print("=" * 60)
    
    results = []
    results.append(test_badge_verification())
    results.append(test_level_progression())
    results.append(test_xp_progress_calculation())
    
    passed = sum(results)
    total = len(results)
    
    print(f"\n" + "=" * 60)
    print(f"📊 Additional Tests Summary")
    print(f"=" * 60)
    print(f"Tests Passed: {passed}/{total}")
    print(f"Success Rate: {(passed/total*100):.1f}%")
    
    if passed == total:
        print("🎉 All additional validation tests passed!")
    else:
        print("⚠️  Some validation tests failed")