//avatar
const avatar = document.getElementById('avatar');

// Render avatar with profile picture or initial
function renderAvatar() {
    const username = localStorage.getItem('username');
    const profilePicture = localStorage.getItem('userProfilePicture');

    if (profilePicture) {
        avatar.innerHTML = `<img src="${profilePicture}" alt="${username}">`;
    } else {
        avatar.textContent = username.charAt(0).toUpperCase();
    }
}

renderAvatar();

// Get auth token and blog ID from URL
const token = localStorage.getItem('authToken');
const currentUserId = parseInt(localStorage.getItem('userId'));
const urlParams = new URLSearchParams(window.location.search);
const blogId = urlParams.get('id');
const main = document.querySelector('.main-container');
const loadingSpinner = document.getElementById('loading');

// Store blog author ID globally
let blogAuthorId = null;

// Loading functions
function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

// Fetch specific blog details
async function fetchBlogDetails() {
    try {
        showLoading(true);

        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/blog/${blogId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        console.log('Blog details fetched successfully');
        const blog = await response.json();
        renderBlogPost(blog.data);
        return blog; // Return the blog data

    } catch (error) {
        console.error('Error fetching blog details:', error);
        // Redirect to homepage if blog not found
        window.location.href = 'homepage.html';
    } finally {
        showLoading(false);
    }
}

function renderBlogPost(blog) {
    console.log('Blog data:', blog); // Debug log to see all fields

    const blogDate = formatDate(blog.created_at);
    const blogAuthor = blog.username;
    blogAuthorId = blog.user_id || blog.userId || blog.author_id; // Store globally
    const blogContent = blog.content;
    const blogTitle = blog.title;
    const blogImage = blog.image_path;
    const avatarInitial = blog.username.charAt(0).toUpperCase();
    const profilePicture = blog.profile_picture;
    const likeCount = blog.like_count || 0;
    const commentCount = blog.comment_count || 0;
    const isLiked = blog.liked_by_current_user || false;
    const isReported = blog.reported_by_current_user || false;

    console.log('Author ID:', blogAuthorId); // Debug log

    // Create avatar HTML - use profile picture if available, otherwise use initial
    const avatarHTML = profilePicture ?
        `<img src="${profilePicture}" alt="${blogAuthor}">` :
        avatarInitial;

    // Create comment input avatar - use current user's profile picture
    const currentUsername = localStorage.getItem('username');
    const currentUserProfilePic = localStorage.getItem('userProfilePicture');
    const commentInputAvatarHTML = currentUserProfilePic ?
        `<img src="${currentUserProfilePic}" alt="${currentUsername}">` :
        currentUsername.charAt(0).toUpperCase();

    const HTML = `
    <div class="blog-container">
            <article class="blog-post">
                <div class="blog-header">
                    <img src="${blogImage}" alt="Early Morning Concept" class="blog-image" />
                </div>
                <div class="blog-content">
                    <h1 class="blog-title">${blogTitle}</h1>
                    <div class="author-info">
                        <div class="author-details">
                            <div class="author-avatar" style="cursor: pointer;" data-author-id="${blogAuthorId}">${avatarHTML}</div>
                            <span class="author-name" style="cursor: pointer;" data-author-id="${blogAuthorId}">${blogAuthor}</span>
                            <span class="post-date">${blogDate}</span>
                        </div>
                    </div>
                    <div class="content-divider"></div>
                    <div class="blog-text">
                        ${blogContent.split('\n').map(paragraph => 
                            paragraph.trim() ? `<p>${paragraph.trim()}</p>` : ''
                        ).join('')}
                    </div>
                    
                    <!-- Like and Comment Section -->
                    <div class="engagement-section">
                        <div class="engagement-stats">
                            <div class="stat-item">
                                <i class="fa-solid fa-heart" style="color: #e74c3c;"></i>
                                <span id="like-count">${likeCount}</span>
                                <span>Likes</span>
                            </div>
                            <div class="stat-item">
                                <i class="fa-solid fa-comment" style="color: #3498db;"></i>
                                <span id="comment-count">${commentCount}</span>
                                <span>Comments</span>
                            </div>
                        </div>
                        
                        <div class="engagement-actions">
                            <button class="engagement-btn like-btn" id="like-btn">
                                <i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart"></i>
                                <span>${isLiked ? 'Unlike' : 'Like'}</span>
                            </button>
                            <button class="engagement-btn comment-btn" id="comment-btn">
                                <i class="fa-regular fa-comment"></i>
                                <span>Comment</span>
                            </button>
                            <button class="engagement-btn report-btn" id="report-btn" ${isReported ? 'disabled' : ''} style="${isReported ? 'opacity: 0.5; cursor: not-allowed;' : ''}">
                                <i class="fa-regular fa-flag"></i>
                                <span>Report</span>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Comments Section -->
                    <div class="comments-section" id="comments">
                        <h3 class="comments-title">Comments (<span id="comments-count">${commentCount}</span>)</h3>
                        
                        <!-- Add Comment Form -->
                        <div class="add-comment">
                            <div class="comment-avatar">${commentInputAvatarHTML}</div>
                            <div class="comment-input-wrapper">
                                <textarea 
                                    id="comment-input" 
                                    class="comment-textarea" 
                                    placeholder="Write a comment..."
                                    rows="3"
                                ></textarea>
                                <button class="post-comment-btn" id="post-comment-btn">Post Comment</button>
                            </div>
                        </div>
                        
                        <!-- Comments List -->
                        <div class="comments-list" id="comments-list">
                            <p class="loading-comments">Loading comments...</p>
                        </div>
                    </div>
                </div>
            </article>
        </div>`
    main.innerHTML = HTML;
    
    // Setup event listeners after rendering
    setupEngagementListeners();
    setupAuthorClickHandler();
    fetchComments();
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Fetch blog details when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (blogId) {
        fetchBlogDetails().then(() => {
            // Check if URL has #comments hash and scroll to comments section
            if (window.location.hash === '#comments') {
                setTimeout(() => {
                    const commentsSection = document.getElementById('comments');
                    if (commentsSection) {
                        commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 500); // Small delay to ensure content is rendered
            }
        });
    } else {
        // Redirect to homepage if no blog ID is provided
        window.location.href = 'homepage.html';
    }
});

// Setup engagement event listeners
function setupEngagementListeners() {
    const likeBtn = document.getElementById('like-btn');
    const commentBtn = document.getElementById('comment-btn');
    const postCommentBtn = document.getElementById('post-comment-btn');
    const reportBtn = document.getElementById('report-btn');
    
    // Like button handler
    if (likeBtn) {
        likeBtn.addEventListener('click', handleLike);
    }
    
    // Comment button handler - scroll to comments
    if (commentBtn) {
        commentBtn.addEventListener('click', () => {
            document.getElementById('comments').scrollIntoView({ behavior: 'smooth' });
            document.getElementById('comment-input').focus();
        });
    }
    
    // Post comment button handler
    if (postCommentBtn) {
        postCommentBtn.addEventListener('click', handlePostComment);
    }

    // Report button handler
    if (reportBtn) {
        reportBtn.addEventListener('click', () => {
            // Don't open modal if button is disabled
            if (reportBtn.disabled) {
                return;
            }
            showReportReasonModal();
        });
    }
}

// Handle like/unlike
async function handleLike() {
    const likeBtn = document.getElementById('like-btn');
    const likeIcon = likeBtn.querySelector('i');
    const likeText = likeBtn.querySelector('span');
    const likeCount = document.getElementById('like-count');
    
    // Store current state for rollback if API fails
    const wasLiked = likeIcon.classList.contains('fa-solid');
    const currentCount = parseInt(likeCount.textContent);
    
    // Disable button to prevent multiple clicks
    likeBtn.disabled = true;
    
    // Optimistically update UI before API call
    if (wasLiked) {
        likeIcon.classList.remove('fa-solid');
        likeIcon.classList.add('fa-regular');
        likeText.textContent = 'Like';
        likeCount.textContent = currentCount - 1;
    } else {
        likeIcon.classList.remove('fa-regular');
        likeIcon.classList.add('fa-solid');
        likeText.textContent = 'Unlike';
        likeCount.textContent = currentCount + 1;
    }
    
    try {
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ blog_id: blogId })
        });

        if (!response.ok) {
            throw new Error('Failed to update like');
        }

        const data = await response.json();
        
        // API call successful - UI is already updated optimistically
    } catch (error) {
        console.error('Error updating like:', error);
        
        // Rollback UI changes if API call failed
        if (wasLiked) {
            likeIcon.classList.remove('fa-regular');
            likeIcon.classList.add('fa-solid');
            likeText.textContent = 'Unlike';
            likeCount.textContent = currentCount;
        } else {
            likeIcon.classList.remove('fa-solid');
            likeIcon.classList.add('fa-regular');
            likeText.textContent = 'Like';
            likeCount.textContent = currentCount;
        }
        
        showSuccessModal('Error', 'Failed to update like. Please try again.');
    } finally {
        // Re-enable button after request completes
        likeBtn.disabled = false;
    }
}

// Fetch comments
async function fetchComments() {
    try {
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/comment/${blogId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }

        const data = await response.json();
        renderComments(data.data || []);
    } catch (error) {
        console.error('Error fetching comments:', error);
        document.getElementById('comments-list').innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
    }
}

// Render comments
function renderComments(comments) {
    const commentsList = document.getElementById('comments-list');
    
    if (comments.length === 0) {
        commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        return;
    }
    
    const commentsHTML = comments.map(comment => {
        const commentDate = formatDate(comment.created_at);
        const commentAuthor = comment.user.name;
        const commentAuthorId = comment.user.id;
        const commentId = comment.id;
        const commentAvatarInitial = commentAuthor.charAt(0).toUpperCase();
        const profilePicture = comment.user.profile_picture;
        
        // Use profile picture if available, otherwise use initial
        const commentAvatarHTML = profilePicture 
            ? `<img src="${profilePicture}" alt="${commentAuthor}">` 
            : commentAvatarInitial;
        
        // Show edit button if current user is comment owner
        const canEdit = (currentUserId === commentAuthorId);
        const editButtonHTML = canEdit 
            ? `<button class="edit-comment-btn" data-comment-id="${commentId}" title="Edit comment">
                <i class="fa-solid fa-pen-to-square"></i>
               </button>` 
            : '';
        
        // Show delete button if current user is comment owner or blog owner
        const canDelete = (currentUserId === commentAuthorId) || (currentUserId === blogAuthorId);
        const deleteButtonHTML = canDelete 
            ? `<button class="delete-comment-btn" data-comment-id="${commentId}" title="Delete comment">
                <i class="fa-solid fa-trash"></i>
               </button>` 
            : '';
        
        return `
            <div class="comment-item" data-comment-id="${commentId}">
                <div class="comment-avatar">${commentAvatarHTML}</div>
                <div class="comment-content">
                    <div class="comment-header">
                        <span class="comment-author">${commentAuthor}</span>
                        <span class="comment-date">${commentDate}</span>
                        <div class="comment-actions">
                            ${editButtonHTML}
                            ${deleteButtonHTML}
                        </div>
                    </div>
                    <p class="comment-text" data-comment-id="${commentId}">${comment.comment}</p>
                </div>
            </div>
        `;
    }).join('');
    
    commentsList.innerHTML = commentsHTML;
    
    // Add event listeners to edit and delete buttons
    attachEditCommentListeners();
    attachDeleteCommentListeners();
}

// Handle post comment
async function handlePostComment() {
    const commentInput = document.getElementById('comment-input');
    const commentText = commentInput.value.trim();
    
    if (!commentText) {
        showSuccessModal('Validation Error', 'Please write a comment before posting.');
        return;
    }
    
    try {
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/comment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blog_id: blogId,
                comment: commentText
            })
        });

        if (!response.ok) {
            throw new Error('Failed to post comment');
        }

        const data = await response.json();
        
        // Clear input
        commentInput.value = '';
        
        // Update comment count
        const commentCount = document.getElementById('comment-count');
        const commentsCount = document.getElementById('comments-count');
        const newCount = parseInt(commentCount.textContent) + 1;
        commentCount.textContent = newCount;
        commentsCount.textContent = newCount;
        
        // Refresh comments
        fetchComments();
        
        showSuccessModal('Success!', 'Comment posted successfully!');
    } catch (error) {
        console.error('Error posting comment:', error);
        showSuccessModal('Error', 'Failed to post comment. Please try again.');
    }
}

// Report functionality for blog page
function showReportReasonModal() {
    const reportReasonModal = document.getElementById('reportReasonModal');
    reportReasonModal.style.display = 'flex';
    
    // Fetch report types when modal opens
    fetchReportTypes();
}

function hideReportReasonModal() {
    const reportReasonModal = document.getElementById('reportReasonModal');
    reportReasonModal.style.display = 'none';
    document.getElementById('reportReason').value = '';
}

// Fetch report types from API
async function fetchReportTypes() {
    try {
        const response = await fetch('https://content-corner-8vf4.onrender.com/api/report-types', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch report types');
        }

        const result = await response.json();
        console.log('Report types:', result);
        
        populateReportTypes(result.data);

    } catch (error) {
        console.error('Error fetching report types:', error);
        // Fallback to default options if API fails
    }
}

// Populate report types dropdown
function populateReportTypes(reportTypes) {
    const selectElement = document.getElementById('reportReason');
    
    // Clear existing options except the first one
    selectElement.innerHTML = '<option value="">Select a reason...</option>';
    
    // Add options from API
    reportTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        selectElement.appendChild(option);
    });
}

function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    modal.style.display = 'flex';
}

function hideSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.style.display = 'none';
}

async function submitReport(type, customReason) {
    try {
        const response = await fetch('https://content-corner-8vf4.onrender.com/api/reports', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blog_id: blogId,
                type: type,
                reason: customReason
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit report');
        }

        const data = await response.json();
        console.log('Report submitted:', data);
        
        // Disable report button after successful report
        const reportBtn = document.getElementById('report-btn');
        if (reportBtn) {
            reportBtn.disabled = true;
            reportBtn.style.opacity = '0.5';
            reportBtn.style.cursor = 'not-allowed';
        }
        
        hideReportReasonModal();
        showSuccessModal('Report Submitted', 'Thank you for reporting. We will review this blog.');
        
    } catch (error) {
        console.error('Error submitting report:', error);
        showSuccessModal('Error', 'Failed to submit report. Please try again.');
    }
}

// Report modal event listeners
document.getElementById('submitReportBtn').addEventListener('click', function() {
    const type = document.getElementById('reportReason').value;
    const customReason = document.getElementById('reportReasonText').value.trim();
    
    if (!type) {
        showSuccessModal('Validation Error', 'Please select a reason for reporting.');
        return;
    }
    
    if (!customReason) {
        showSuccessModal('Validation Error', 'Please describe the issue in detail.');
        return;
    }
    
    submitReport(type, customReason);
});

document.getElementById('cancelReportBtn').addEventListener('click', function() {
    hideReportReasonModal();
});

document.getElementById('modalOkBtn').addEventListener('click', function() {
    hideSuccessModal();
});

// Author Info Modal Functions
function setupAuthorClickHandler() {
    const authorAvatar = document.querySelector('.author-avatar');
    const authorName = document.querySelector('.author-name');
    
    if (authorAvatar) {
        authorAvatar.addEventListener('click', function() {
            const authorId = this.getAttribute('data-author-id');
            fetchAndShowAuthorInfo(authorId);
        });
    }
    
    if (authorName) {
        authorName.addEventListener('click', function() {
            const authorId = this.getAttribute('data-author-id');
            fetchAndShowAuthorInfo(authorId);
        });
    }
}

async function fetchAndShowAuthorInfo(authorId) {
    try {
        console.log('Fetching author info for ID:', authorId);
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/user/${authorId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch author info');
        }

        const result = await response.json();
        console.log('Author info:', result);
        
        const authorData = result.data;
        showAuthorModal(authorData);
        
    } catch (error) {
        console.error('Error fetching author info:', error);
        showSuccessModal('Error', 'Unable to load author information.');
    }
}

function showAuthorModal(authorData) {
    const modal = document.getElementById('authorModal');
    const modalAvatar = document.getElementById('authorModalAvatar');
    const modalName = document.getElementById('authorModalName');
    const modalDescription = document.getElementById('authorModalDescription');
    
    // Set author details
    const avatarInitial = authorData.username.charAt(0).toUpperCase();
    const profilePicture = authorData.profile_picture;
    
    // Use profile picture if available, otherwise use initial
    if (profilePicture) {
        modalAvatar.innerHTML = `<img src="${profilePicture}" alt="${authorData.username}">`;
    } else {
        modalAvatar.textContent = avatarInitial;
    }
    
    modalName.textContent = authorData.username;
    
    if (authorData.description) {
        modalDescription.textContent = authorData.description;
    } else {
        modalDescription.innerHTML = '<em style="color: #888;">This user hasn\'t added a bio yet.</em>';
    }
    
    modal.style.display = 'flex';
}

function hideAuthorModal() {
    const modal = document.getElementById('authorModal');
    modal.style.display = 'none';
}

// Author modal event listeners
document.getElementById('closeAuthorModal').addEventListener('click', hideAuthorModal);
document.getElementById('authorModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideAuthorModal();
    }
});

// Edit comment functionality
function attachEditCommentListeners() {
    const editButtons = document.querySelectorAll('.edit-comment-btn');
    editButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const commentId = button.getAttribute('data-comment-id');
            startEditingComment(commentId);
        });
    });
}

function startEditingComment(commentId) {
    const commentTextElement = document.querySelector(`.comment-text[data-comment-id="${commentId}"]`);
    const currentText = commentTextElement.textContent;
    
    // Create textarea for editing
    const textarea = document.createElement('textarea');
    textarea.className = 'edit-comment-textarea';
    textarea.value = currentText;
    textarea.rows = 3;
    
    // Create action buttons
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'edit-comment-actions';
    
    const saveBtn = document.createElement('button');
    saveBtn.className = 'save-edit-btn';
    saveBtn.textContent = 'Save';
    saveBtn.onclick = () => saveEditedComment(commentId, textarea.value);
    
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'cancel-edit-btn';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = () => cancelEditingComment(commentId, currentText);
    
    actionsDiv.appendChild(saveBtn);
    actionsDiv.appendChild(cancelBtn);
    
    // Replace comment text with textarea and buttons
    commentTextElement.replaceWith(textarea);
    textarea.after(actionsDiv);
}

function cancelEditingComment(commentId, originalText) {
    const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
    const textarea = commentItem.querySelector('.edit-comment-textarea');
    const actionsDiv = commentItem.querySelector('.edit-comment-actions');
    
    // Create new comment text element
    const commentTextElement = document.createElement('p');
    commentTextElement.className = 'comment-text';
    commentTextElement.setAttribute('data-comment-id', commentId);
    commentTextElement.textContent = originalText;
    
    // Replace textarea with original text
    textarea.replaceWith(commentTextElement);
    actionsDiv.remove();
}

async function saveEditedComment(commentId, newText) {
    const trimmedText = newText.trim();
    
    if (!trimmedText) {
        showSuccessModal('Validation Error', 'Comment cannot be empty.');
        return;
    }
    
    try {
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/comment/${commentId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blog_id: parseInt(blogId),
                comment: trimmedText
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to update comment');
        }

        // Update the comment text in DOM
        const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
        const textarea = commentItem.querySelector('.edit-comment-textarea');
        const actionsDiv = commentItem.querySelector('.edit-comment-actions');
        
        const commentTextElement = document.createElement('p');
        commentTextElement.className = 'comment-text';
        commentTextElement.setAttribute('data-comment-id', commentId);
        commentTextElement.textContent = trimmedText;
        
        textarea.replaceWith(commentTextElement);
        actionsDiv.remove();
        
        showSuccessModal('Success', 'Comment updated successfully.');
    } catch (error) {
        console.error('Error updating comment:', error);
        showSuccessModal('Error', error.message || 'Failed to update comment. Please try again.');
    }
}

// Delete comment functionality
function attachDeleteCommentListeners() {
    const deleteButtons = document.querySelectorAll('.delete-comment-btn');
    deleteButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.stopPropagation();
            const commentId = button.getAttribute('data-comment-id');
            
            // Confirm before deleting
            if (confirm('Are you sure you want to delete this comment?')) {
                await deleteComment(commentId);
            }
        });
    });
}

async function deleteComment(commentId) {
    try {
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/comment/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete comment');
        }

        // Remove the comment from DOM
        const commentItem = document.querySelector(`.comment-item[data-comment-id="${commentId}"]`);
        if (commentItem) {
            commentItem.remove();
        }

        // Update both comment count elements
        const commentCountElement = document.getElementById('comment-count');
        const commentsCountElement = document.getElementById('comments-count');
        
        if (commentCountElement) {
            const currentCount = parseInt(commentCountElement.textContent) || 0;
            const newCount = Math.max(0, currentCount - 1);
            commentCountElement.textContent = newCount;
        }
        
        if (commentsCountElement) {
            const currentCount = parseInt(commentsCountElement.textContent) || 0;
            const newCount = Math.max(0, currentCount - 1);
            commentsCountElement.textContent = newCount;
        }

        // Check if no comments left
        const commentsList = document.getElementById('comments-list');
        if (commentsList.children.length === 0) {
            commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
        }

        showSuccessModal('Success', 'Comment deleted successfully.');
    } catch (error) {
        console.error('Error deleting comment:', error);
        showSuccessModal('Error', error.message || 'Failed to delete comment. Please try again.');
    }
}