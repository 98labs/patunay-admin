# Multi-Tenant RBAC Test Scenarios

This document outlines comprehensive test scenarios to validate the multi-tenant RBAC + ABAC implementation.

## Test Users Created

| User | Role | Organization | Email | Test Purpose |
|------|------|--------------|-------|--------------|
| Alice Anderson | Super User | Global | alice@patunay.com | Global access testing |
| Bob Williams | Admin | Metro Gallery | bob@metroartgallery.com | Organization admin testing |
| Carol Davis | Admin | City Museum | carol@citymuseum.org | Different org admin testing |
| David Miller | Issuer | Miller Studio | david@millerstudio.com | Cross-org issuer testing |
| Emma Thompson | Appraiser | Premier Auction | emma@premierauction.com | Cross-org appraiser testing |
| Frank Garcia | Staff | Metro Gallery | frank@metroartgallery.com | Gallery staff testing |
| Grace Martinez | Staff | City Museum | grace@citymuseum.org | Museum staff testing |
| Henry Rodriguez | Viewer | Heritage Collection | henry@heritagecollection.com | Limited access testing |
| Isabel Wilson | Staff | Metro Gallery | isabel@metroartgallery.com | Additional staff testing |

## Test Scenarios

### 1. Super User Access Tests

**User**: Alice Anderson (Super User)

**Expected Capabilities**:
- ✅ Access all organizations
- ✅ View Organization Management page
- ✅ Create new organizations
- ✅ Manage users across all organizations
- ✅ View system-wide statistics
- ✅ Access migration verification tools
- ✅ Grant cross-organizational permissions

**Test Cases**:
1. Login and verify global navigation menu appears
2. Switch between different organizations
3. Create a new test organization
4. Manage users in Metro Gallery
5. Manage users in City Museum
6. View system statistics across all organizations
7. Grant cross-org permissions to other users

### 2. Organization Admin Access Tests

**User**: Bob Williams (Metro Gallery Admin)

**Expected Capabilities**:
- ✅ Manage Metro Gallery users only
- ✅ Manage Metro Gallery artworks
- ✅ Manage Metro Gallery NFC tags
- ✅ View Metro Gallery statistics
- ✅ Grant cross-org permissions for Metro Gallery
- ❌ Cannot access other organizations' data
- ❌ Cannot create organizations
- ❌ Cannot access super admin features

**Test Cases**:
1. Login and verify organization-scoped menu
2. Attempt to access City Museum data (should fail)
3. Create new user for Metro Gallery
4. Manage artwork in Metro Gallery
5. Issue NFC tags for gallery artworks
6. View gallery-specific statistics
7. Grant appraiser access to Emma Thompson

**User**: Carol Davis (City Museum Admin)

**Test Cases**:
1. Verify separate organization context
2. Attempt to access Metro Gallery data (should fail)
3. Manage museum staff and artworks
4. View museum-specific statistics

### 3. Cross-Organizational Issuer Tests

**User**: David Miller (Artist/Issuer)

**Expected Capabilities**:
- ✅ Manage own studio artworks
- ✅ Issue NFC tags for own artworks
- ✅ Create artworks in own studio
- ✅ Issue NFC tags for gallery exhibitions (cross-org)
- ✅ Attach tags to museum exhibitions (cross-org)
- ❌ Cannot manage other users
- ❌ Cannot view admin statistics

**Test Cases**:
1. Login and verify issuer-specific menu
2. Create artwork in own studio
3. Issue NFC tag for studio artwork
4. Switch to Metro Gallery context (via cross-org permission)
5. Attach NFC tag to gallery artwork
6. Attempt to manage gallery users (should fail)
7. Verify limited access to gallery statistics

### 4. Cross-Organizational Appraiser Tests

**User**: Emma Thompson (Appraiser)

**Expected Capabilities**:
- ✅ Create appraisals for own auction house
- ✅ View detailed artwork information
- ✅ Create appraisals for Metro Gallery artworks (cross-org)
- ✅ Create appraisals for City Museum artworks (cross-org)
- ✅ Create appraisals for Heritage Collection (cross-org)
- ❌ Cannot manage users or organizations
- ❌ Cannot issue NFC tags

**Test Cases**:
1. Login and verify appraiser-specific menu
2. Create appraisal for auction house artwork
3. Switch to Metro Gallery context
4. View detailed artwork information for gallery piece
5. Create appraisal for gallery artwork
6. Switch to City Museum context
7. Create appraisal for museum artwork
8. Attempt to issue NFC tag (should fail)
9. Attempt to manage users (should fail)

### 5. Organization Staff Tests

**User**: Frank Garcia (Metro Gallery Staff)

**Expected Capabilities**:
- ✅ Manage Metro Gallery artworks
- ✅ View Metro Gallery artworks
- ✅ Create/edit appraisals for gallery artworks
- ✅ View basic gallery statistics
- ❌ Cannot issue NFC tags
- ❌ Cannot manage users
- ❌ Cannot access other organizations

**Test Cases**:
1. Login and verify staff-level menu
2. Create new artwork record for gallery
3. Edit existing gallery artwork
4. Attempt to issue NFC tag (should fail)
5. Attempt to manage users (should fail)
6. Attempt to access City Museum (should fail)
7. View basic gallery statistics

**User**: Grace Martinez (City Museum Staff)

**Test Cases**:
1. Verify museum-specific context
2. Manage museum artwork records
3. Attempt to access gallery data (should fail)

### 6. Viewer Access Tests

**User**: Henry Rodriguez (Heritage Collection Viewer)

**Expected Capabilities**:
- ✅ View Heritage Collection artworks (basic info)
- ✅ View public statistics
- ❌ Cannot view appraisal details
- ❌ Cannot create/edit artworks
- ❌ Cannot manage users
- ❌ Cannot issue NFC tags

**Test Cases**:
1. Login and verify minimal menu options
2. View basic artwork information
3. Attempt to view appraisal details (should be hidden)
4. Attempt to create artwork (should fail)
5. Attempt to manage users (should fail)
6. Attempt to issue NFC tags (should fail)
7. View public statistics only

### 7. Permission Inheritance Tests

**Test Scenarios**:
1. **Role Hierarchy**: Verify super user can perform all admin functions
2. **Organization Boundaries**: Verify admins cannot access other org data
3. **Cross-Org Permissions**: Verify Emma can appraise across organizations
4. **Permission Revocation**: Remove cross-org permission and verify access is denied
5. **Role Changes**: Change user role and verify menu/access updates

### 8. Navigation and UI Tests

**Test Cases**:
1. **Organization Switcher**: Verify users see appropriate organizations
2. **Menu Filtering**: Verify menu items match user permissions
3. **Route Protection**: Verify direct URL access is properly blocked
4. **Error Messages**: Verify clear access denied messages
5. **Permission Guards**: Verify components hide/show based on permissions

### 9. API Access Control Tests

**Test Cases**:
1. **User Management API**: Test org-scoped user operations
2. **Artwork API**: Test organization filtering
3. **NFC Tag API**: Test issuer permissions
4. **Appraisal API**: Test appraiser cross-org access
5. **Statistics API**: Test data scoping by role

### 10. Edge Cases and Security Tests

**Test Cases**:
1. **Session Expiry**: Verify permission checks after session refresh
2. **Role Changes**: Test live permission updates
3. **Organization Deactivation**: Test access when org becomes inactive
4. **Cross-Org Expiry**: Test expired cross-org permissions
5. **Direct API Calls**: Test API security with manual requests
6. **SQL Injection**: Verify RLS policies prevent data leakage

## Validation Checklist

### ✅ Basic Functionality
- [ ] All users can log in successfully
- [ ] Organization switcher works correctly
- [ ] Navigation menus filter based on permissions
- [ ] Routes are properly protected

### ✅ Role-Based Access Control
- [ ] Super user has global access
- [ ] Admins are limited to their organizations
- [ ] Staff have appropriate limited access
- [ ] Viewers have minimal read-only access

### ✅ Cross-Organizational Access
- [ ] Issuers can work across authorized organizations
- [ ] Appraisers can access multiple organizations
- [ ] Cross-org permissions can be granted and revoked
- [ ] Expired permissions are properly handled

### ✅ Data Isolation
- [ ] Organizations cannot see each other's data
- [ ] Users cannot access unauthorized organizations
- [ ] Statistics are properly scoped
- [ ] API calls respect organization boundaries

### ✅ Security
- [ ] Direct URL access is blocked for unauthorized routes
- [ ] API endpoints validate permissions
- [ ] Database RLS policies prevent data leakage
- [ ] Cross-org permissions require proper authorization

### ✅ User Experience
- [ ] Clear error messages for access denied
- [ ] Intuitive organization switching
- [ ] Appropriate loading states
- [ ] Responsive permission-based UI

## Automated Test Commands

```sql
-- Run this after creating sample data to verify data isolation
SELECT 
  u.first_name,
  u.last_name,
  u.role,
  o.name as organization,
  count(a.id) as artwork_count
FROM profiles u
LEFT JOIN organization_users ou ON u.id = ou.user_id
LEFT JOIN organizations o ON ou.organization_id = o.id
LEFT JOIN artworks a ON a.organization_id = o.id
WHERE u.first_name IN ('Bob', 'Carol', 'David', 'Emma', 'Frank')
GROUP BY u.first_name, u.last_name, u.role, o.name
ORDER BY u.first_name;
```

## Expected Results Summary

After running all tests, the system should demonstrate:

1. **Complete data isolation** between organizations
2. **Proper role hierarchy** enforcement
3. **Functional cross-organizational permissions** for specialized roles
4. **Secure API access** with proper validation
5. **Intuitive user experience** with permission-aware UI
6. **Robust security** preventing unauthorized access

Any failing test cases should be documented and addressed before deployment to production.