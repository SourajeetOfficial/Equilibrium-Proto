# Equilibrium API Documentation
## Backend API Reference

---

## 🌐 Base URL
\`\`\`
Development: http://localhost:3000/api
Production: https://api.equilibrium.app/api
\`\`\`

## 🔐 Authentication
All protected endpoints require a JWT token in the Authorization header:
\`\`\`
Authorization: Bearer <jwt_token>
\`\`\`

---

## 📋 API Endpoints

### Authentication Routes (`/auth`)

#### POST `/auth/register`
Register a new user account.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "confirmPassword": "securePassword123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "pseudonymId": "anonymous_id"
  }
}
\`\`\`

#### POST `/auth/login`
Authenticate user and return JWT token.

**Request Body:**
\`\`\`json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "token": "jwt_token_here",
  "pseudonymId": "anonymous_id",
  "userId": "user_id"
}
\`\`\`

#### GET `/auth/profile`
Get current user profile information.

**Headers:** `Authorization: Bearer <token>`

**Response:**
\`\`\`json
{
  "id": "user_id",
  "email": "user@example.com",
  "pseudonymId": "anonymous_id",
  "consentFlags": {
    "usageTracking": true,
    "cloudSync": false,
    "emergencyContacts": true,
    "anonymousAnalytics": false,
    "crashReporting": true
  },
  "createdAt": "2024-01-15T10:30:00Z"
}
\`\`\`

#### POST `/auth/consent`
Update user consent preferences.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "consentFlags": {
    "usageTracking": true,
    "cloudSync": false,
    "emergencyContacts": true,
    "anonymousAnalytics": false,
    "crashReporting": true
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "consentFlags": {
    "usageTracking": true,
    "cloudSync": false,
    "emergencyContacts": true,
    "anonymousAnalytics": false,
    "crashReporting": true
  }
}
\`\`\`

#### POST `/auth/push-token`
Save user's push notification token.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "token": "expo_push_token_here"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Push token saved successfully"
}
\`\`\`

#### GET `/auth/export`
Export all user data from server.

**Headers:** `Authorization: Bearer <token>`

**Response:**
\`\`\`json
{
  "exportDate": "2024-01-15T10:30:00Z",
  "userData": {
    "profile": { /* user profile data */ },
    "aggregates": [ /* aggregated wellness data */ ],
    "forumPosts": [ /* user's forum posts */ ],
    "preferences": { /* user preferences */ }
  }
}
\`\`\`

#### POST `/auth/clear-data`
Clear all user data from server (keep account).

**Headers:** `Authorization: Bearer <token>`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "All server data cleared successfully"
}
\`\`\`

#### POST `/auth/delete`
Permanently delete user account and all data.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "password": "userPassword"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Account deleted successfully"
}
\`\`\`

---

### Aggregate Data Routes (`/aggregate`)

#### POST `/aggregate/log`
Log aggregated wellness metrics (pseudonymized).

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "date": "2024-01-15",
  "aggregatedMetrics": {
    "averageWellnessScore": 75,
    "moodTrend": "improving",
    "usagePatterns": {
      "avgScreenTime": 240,
      "avgPickups": 30
    }
  }
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "message": "Aggregate data logged successfully"
}
\`\`\`

#### GET `/aggregate/retrieve`
Retrieve user's aggregated data.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `days` (optional): Number of days to retrieve (default: 30)
- `startDate` (optional): Start date in YYYY-MM-DD format
- `endDate` (optional): End date in YYYY-MM-DD format

**Response:**
\`\`\`json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-15",
      "aggregatedMetrics": {
        "averageWellnessScore": 75,
        "moodTrend": "improving",
        "usagePatterns": {
          "avgScreenTime": 240,
          "avgPickups": 30
        }
      }
    }
  ]
}
\`\`\`

---

### Alert Routes (`/alerts`)

#### POST `/alerts/trigger`
Trigger a wellness alert for intervention.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "alertType": "wellness_decline",
  "severity": "medium",
  "metrics": {
    "wellnessScore": 45,
    "moodTrend": "declining",
    "daysAffected": 5
  },
  "message": "Significant wellness decline detected"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "alertId": "alert_id_here",
  "interventionSuggested": true,
  "resources": [
    {
      "type": "crisis_line",
      "name": "Crisis Text Line",
      "contact": "741741"
    }
  ]
}
\`\`\`

---

### Contact Routes (`/contacts`)

#### GET `/contacts/emergency`
Get emergency contacts and crisis resources.

**Query Parameters:**
- `lat` (optional): Latitude for location-based results
- `lng` (optional): Longitude for location-based results
- `radius` (optional): Search radius in miles (default: 25)

**Response:**
\`\`\`json
{
  "success": true,
  "emergencyContacts": [
    {
      "name": "National Suicide Prevention Lifeline",
      "phone": "988",
      "type": "crisis_line",
      "available24_7": true
    },
    {
      "name": "Crisis Text Line",
      "phone": "741741",
      "type": "text_line",
      "available24_7": true
    }
  ],
  "localResources": [
    {
      "name": "Local Crisis Center",
      "phone": "+1234567890",
      "address": "123 Main St, City, State",
      "distance": 2.5
    }
  ]
}
\`\`\`

---

### Forum Routes (`/forum`)

#### GET `/forum/posts`
Get forum posts with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 20)
- `category` (optional): Filter by category
- `sort` (optional): Sort by 'recent', 'popular', 'trending'

**Response:**
\`\`\`json
{
  "success": true,
  "posts": [
    {
      "id": "post_id",
      "title": "Dealing with anxiety",
      "content": "Post content here...",
      "authorPseudonym": "anonymous_user_123",
      "category": "support",
      "tags": ["anxiety", "coping"],
      "upvotes": 15,
      "downvotes": 2,
      "commentCount": 8,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
\`\`\`

#### POST `/forum/posts`
Create a new forum post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "title": "My experience with therapy",
  "content": "I wanted to share my journey...",
  "category": "support",
  "tags": ["therapy", "recovery"],
  "isAnonymous": true
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "post": {
    "id": "new_post_id",
    "title": "My experience with therapy",
    "content": "I wanted to share my journey...",
    "authorPseudonym": "anonymous_user_456",
    "category": "support",
    "tags": ["therapy", "recovery"],
    "upvotes": 0,
    "downvotes": 0,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
\`\`\`

#### GET `/forum/posts/:postId`
Get a specific forum post with comments.

**Response:**
\`\`\`json
{
  "success": true,
  "post": {
    "id": "post_id",
    "title": "Post title",
    "content": "Post content...",
    "authorPseudonym": "anonymous_user_123",
    "category": "support",
    "tags": ["tag1", "tag2"],
    "upvotes": 15,
    "downvotes": 2,
    "createdAt": "2024-01-15T10:30:00Z"
  },
  "comments": [
    {
      "id": "comment_id",
      "content": "Thank you for sharing...",
      "authorPseudonym": "anonymous_user_789",
      "upvotes": 5,
      "downvotes": 0,
      "createdAt": "2024-01-15T11:00:00Z"
    }
  ]
}
\`\`\`

#### POST `/forum/posts/:postId/vote`
Vote on a forum post.

**Headers:** `Authorization: Bearer <token>`

**Request Body:**
\`\`\`json
{
  "voteType": "upvote" // or "downvote"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "upvotes": 16,
  "downvotes": 2,
  "userVote": "upvote"
}
\`\`\`

---

### Help Directory Routes (`/help-directory`)

#### GET `/help-directory/professionals`
Search for mental health professionals.

**Query Parameters:**
- `lat`: Latitude (required for location search)
- `lng`: Longitude (required for location search)
- `radius`: Search radius in miles (default: 25)
- `specialty`: Filter by specialty (anxiety, depression, trauma, etc.)
- `type`: Filter by type (therapist, psychiatrist, counselor)
- `acceptingPatients`: Filter by availability (true/false)
- `insurance`: Filter by insurance accepted
- `language`: Filter by languages spoken

**Response:**
\`\`\`json
{
  "success": true,
  "professionals": [
    {
      "id": "professional_id",
      "name": "Dr. Jane Smith",
      "type": "therapist",
      "specialties": ["anxiety", "depression", "trauma"],
      "contactInfo": {
        "phone": "+1234567890",
        "email": "contact@example.com",
        "website": "https://example.com"
      },
      "location": {
        "address": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001",
        "distance": 2.5
      },
      "availability": {
        "acceptingNewPatients": true,
        "emergencyAvailable": false,
        "languages": ["English", "Spanish"]
      },
      "rating": 4.8,
      "reviewCount": 24,
      "verified": true
    }
  ],
  "totalResults": 15,
  "searchRadius": 25
}
\`\`\`

#### GET `/help-directory/crisis-resources`
Get crisis intervention resources.

**Query Parameters:**
- `lat` (optional): Latitude for location-based results
- `lng` (optional): Longitude for location-based results
- `type` (optional): Filter by type (hotline, text_line, chat, local_center)

**Response:**
\`\`\`json
{
  "success": true,
  "crisisResources": [
    {
      "id": "resource_id",
      "name": "National Suicide Prevention Lifeline",
      "type": "hotline",
      "contactInfo": {
        "phone": "988",
        "website": "https://suicidepreventionlifeline.org"
      },
      "availability": {
        "available24_7": true,
        "languages": ["English", "Spanish"]
      },
      "description": "Free and confidential emotional support"
    }
  ]
}
\`\`\`

---

### Reports Routes (`/reports`)

#### GET `/reports/wellness-summary`
Get wellness summary report.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `period`: Time period ('week', 'month', 'quarter', 'year')
- `startDate` (optional): Custom start date
- `endDate` (optional): Custom end date

**Response:**
\`\`\`json
{
  "success": true,
  "summary": {
    "period": "month",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "averageWellnessScore": 75,
    "wellnessScoreTrend": "improving",
    "moodDistribution": {
      "excellent": 8,
      "good": 15,
      "neutral": 5,
      "low": 3
    },
    "insights": [
      {
        "type": "positive",
        "message": "Your wellness score improved by 15% this month",
        "recommendation": "Keep up the good work with your current routine"
      }
    ],
    "achievements": [
      {
        "title": "Consistent Tracker",
        "description": "Logged wellness data for 25+ days this month",
        "earnedDate": "2024-01-25"
      }
    ]
  }
}
\`\`\`

---

## 🔒 Error Responses

All API endpoints return consistent error responses:

\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": "Additional error details (development only)"
  }
}
\`\`\`

### Common Error Codes:
- `UNAUTHORIZED`: Invalid or missing authentication token
- `FORBIDDEN`: User doesn't have permission for this action
- `VALIDATION_ERROR`: Request data validation failed
- `NOT_FOUND`: Requested resource not found
- `RATE_LIMITED`: Too many requests from this IP
- `SERVER_ERROR`: Internal server error

---

## 📊 Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication endpoints**: 5 requests per minute per IP
- **Data logging endpoints**: 100 requests per hour per user
- **Forum endpoints**: 50 requests per hour per user
- **Search endpoints**: 200 requests per hour per user

Rate limit headers are included in responses:
\`\`\`
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642694400
\`\`\`

---

## 🔐 Security Headers

All API responses include security headers:
\`\`\`
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
\`\`\`

---

This API documentation covers all the backend endpoints for the Equilibrium mental health app. The API is designed with privacy and security as top priorities, using pseudonymization and encryption where appropriate to protect user data while still providing valuable functionality.
