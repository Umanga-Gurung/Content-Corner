// Get all buttons and elements
const likeBtns = document.querySelectorAll('.btn-like');
const commentBtns = document.querySelectorAll('.btn-comment');
const flagBtns = document.querySelectorAll('.btn-flag');
const logout = document.querySelector('.logout');
const main = document.querySelector('#main');
const token = localStorage.getItem('authToken');

const loadingSpinner = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const retryBtn = document.getElementById('retry-btn');

// Avatar settings
const avatar = document.getElementById('avatar');

// Fetch and store user profile picture
async function fetchUserProfile() {
    try {
        const userId = localStorage.getItem('userId');
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const result = await response.json();
            console.log('User profile data:', result);
            if (result.data && result.data.profile_picture) {
                console.log('Setting profile picture:', result.data.profile_picture);
                localStorage.setItem('userProfilePicture', result.data.profile_picture);
            } else {
                console.log('No profile picture found in response');
            }
        } else {
            console.error('Failed to fetch user profile:', response.status);
        }
    } catch (error) {
        console.error('Error fetching user profile:', error);
    }
}

// Render avatar with profile picture or initial
function renderAvatar() {
    const username = localStorage.getItem('username');
    const profilePicture = localStorage.getItem('userProfilePicture');

    console.log('Rendering avatar - username:', username, 'profilePicture:', profilePicture);

    if (profilePicture && profilePicture !== 'null' && profilePicture !== 'undefined') {
        console.log('Using profile picture');
        avatar.innerHTML = `<img src="${profilePicture}" alt="${username}">`;
    } else {
        console.log('Using initial letter');
        avatar.textContent = username.charAt(0).toUpperCase();
    }
}

// Initialize avatar
fetchUserProfile().then(() => renderAvatar());


// Fetch Function
async function fetchBlogs() {
    try {
        showLoading(true);
        hideError();

        const response = await fetch('https://content-corner-8vf4.onrender.com/api/blog', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blogs = await response.json();
        // console.log(blogs);
        // console.log(blogs.data[0]);
        renderBlogs(blogs);

    } catch (error) {
        console.error('Error fetching blogs:', error);
        showError('Failed to load blogs. Please try again.');
    } finally {
        showLoading(false);
    }
}

//Render Blogs
function renderBlogs(blogs) {
    console.log(blogs);
    main.innerHTML = ''; // Clear existing blogs
    blogs.data.forEach(blog => {

        const blogID = blog.id;
        const avatarInitial = blog.username.charAt(0).toUpperCase();
        const profilePicture = blog.profile_picture;
        const username = blog.username;
        const title = blog.title;
        const uploadDate = formatToMonthDay(blog.created_at);
        const summary = blog.description;
        const likes = blog.like_count;
        const comments = blog.comment_count;
        const imgURL = blog.image_path;
        const isLiked = blog.liked_by_current_user;
        const isReported = blog.reported_by_current_user;

        // Create avatar HTML - use profile picture if available, otherwise use initial
        const avatarHTML = profilePicture ?
            `<img src="${profilePicture}" alt="${username}">` :
            avatarInitial;

        const HTML = `
    <section id="section-${blogID}">
    <article id="blog" class="blog">
    <div class="blog-content">
      <div class="blog-header">
        <div class="avatar">${avatarHTML}</div>
        <span class="blog-author">${username}</span>
      </div>
      <h2 class="blog-title">${title}</h2>
      <div class="blog-date">${uploadDate}</div>
      <p class="blog-summ">
      ${summary}
      </p>
      <div class="blog-actions">
        <div><button class="btn btn-like" data-section="${blogID}"><i class="fa-${isLiked ? 'solid' : 'regular'} fa-heart like-icon" data-section="${blogID}"></i></button><span class="like-count" data-section="${blogID}">${likes}</span></div>
        <div><button class="btn btn-comment" data-section="${blogID}"><i class="fa-regular fa-comment comment-icon" data-section="${blogID}"></i></button><span class="comment-count" data-section="${blogID}">${comments}</span></div>
        <div><button class="btn btn-flag" data-section="${blogID}" ${isReported ? 'disabled' : ''}><i class="fa-regular fa-flag flag-icon" data-section="${blogID}" style="${isReported ? 'opacity: 0.5; cursor: not-allowed;' : ''}"></i></button></div>
      </div>
    </div>
    <div class="blog-image">
      <img src="${imgURL}" alt="Blog Image">
    </div>
      </article>
    </section>
    `;
        main.insertAdjacentHTML('beforeend', HTML);
    });

    // Setup event handlers after rendering
    setupActionButtons();
    addBlogClickHandlers();
}
// change date
function formatToMonthDay(dateString) {

    const date = new Date(dateString);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const monthName = months[date.getMonth()];
    const day = date.getDate();

    return `${monthName} ${day}`;
}


function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
}

function hideError() {
    errorMessage.style.display = 'none';
}

// Setup action buttons with API integration
function setupActionButtons() {
    // Handle like buttons
    document.querySelectorAll('.btn-like').forEach(likeBtn => {
        likeBtn.addEventListener('click', async(e) => {
            e.stopPropagation(); // Prevent blog click
            const blogId = likeBtn.getAttribute('data-section');
            const likeIcon = likeBtn.querySelector('.like-icon');
            const likeCount = document.querySelector(`.like-count[data-section="${blogId}"]`);

            // Disable button to prevent multiple clicks
            likeBtn.disabled = true;

            // Store current state for rollback if API fails
            const wasLiked = likeIcon.classList.contains('fa-solid');
            const currentCount = parseInt(likeCount.textContent);

            // Optimistically update UI before API call
            likeIcon.classList.toggle('fa-solid');
            likeIcon.classList.toggle('fa-regular');
            likeCount.textContent = wasLiked ? currentCount - 1 : currentCount + 1;

            try {
                const response = await fetch('https://content-corner-8vf4.onrender.com/api/like', {
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
                console.log('Like response:', data);

                // API call successful - UI is already updated optimistically
            } catch (error) {
                console.error('Error updating like:', error);

                // Rollback UI changes if API call failed
                likeIcon.classList.toggle('fa-solid');
                likeIcon.classList.toggle('fa-regular');
                likeCount.textContent = currentCount;
            } finally {
                // Re-enable button after request completes
                likeBtn.disabled = false;
            }
        });
    });

    // Handle comment buttons - redirect to blog page
    document.querySelectorAll('.btn-comment').forEach(commentBtn => {
        commentBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent blog click
            const blogId = commentBtn.getAttribute('data-section');
            window.location.href = `blog.html?id=${blogId}#comments`;
        });
    });

    // Handle flag/report buttons
    document.querySelectorAll('.btn-flag').forEach(flagBtn => {
        flagBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent blog click

            // Don't open modal if button is disabled
            if (flagBtn.disabled) {
                return;
            }

            const blogId = flagBtn.getAttribute('data-section');
            showReportModal(blogId);
        });
    });
}


logout.addEventListener('click', function() {
    showlogoutModal('Logout', 'Are you sure you want to log out');

})

//LogOut Modal functionality
function showlogoutModal(title, message) {
    const modal = document.getElementById('logoutModal');
    const modalTitle = document.getElementById('logoutmodalTitle');
    const modalMessage = document.getElementById('logoutmodalMessage');
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

function closeModel() {
    const modal = document.getElementById('logoutModal');
    modal.style.display = 'none';
}

// Event listeners for modal
document.getElementById('cancelBtn').addEventListener('click', closeModel);
document.getElementById('logoutmodalOkBtn').addEventListener('click', function() {
    closeModel();

    showSuccessModal('Logout', 'Logged Out Successfully', true);
});
document.getElementById('logoutModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModel();
    }
});

// Modal functionality
function showSuccessModal(title, message, shouldLogout = false) {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';

    // Store whether this modal should logout when closed
    modal.dataset.shouldLogout = shouldLogout;
}

function hideModal() {
    const modal = document.getElementById('successModal');
    const shouldLogout = modal.dataset.shouldLogout === 'true';
    modal.style.display = 'none';

    if (shouldLogout) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('userId');
        localStorage.removeItem('userProfilePicture');
        window.location.replace('login.html');
    }
}

// Event listeners for modal
document.getElementById('closeModalBtn').addEventListener('click', hideModal);
document.getElementById('modalOkBtn').addEventListener('click', hideModal);
document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
    }
});

//Handle Section clicks
function addBlogClickHandlers() {
    const blogSections = document.querySelectorAll('.blog');
    blogSections.forEach(blog => {
        blog.style.cursor = 'pointer';
        blog.addEventListener('click', (e) => {
            // Don't redirect if clicking on action buttons (like, comment, flag)
            if (e.target.closest('.blog-actions')) {
                return;
            }

            // Get the section ID from the parent section element
            const sectionElement = blog.closest('section');
            const sectionId = sectionElement.getAttribute('id').replace('section-', '');

            // Redirect to blog page with the ID
            window.location.href = `blog.html?id=${sectionId}`;
        });
    });
}

// Fetching Blogs on page Initialization
document.addEventListener('DOMContentLoaded', function() {
    fetchBlogs();
});

// Report functionality
let currentReportBlogId = null;

function showReportModal(blogId) {
    currentReportBlogId = blogId;
    const reportModal = document.getElementById('reportModal');
    reportModal.style.display = 'flex';
}

function hideReportModal() {
    const reportModal = document.getElementById('reportModal');
    reportModal.style.display = 'none';
    currentReportBlogId = null;
}

function showReportReasonModal() {
    const reportModal = document.getElementById('reportModal');
    const reportReasonModal = document.getElementById('reportReasonModal');
    reportModal.style.display = 'none';
    reportReasonModal.style.display = 'flex';

    // Fetch report types when modal opens
    fetchReportTypes();
}

function hideReportReasonModal() {
    const reportReasonModal = document.getElementById('reportReasonModal');
    reportReasonModal.style.display = 'none';
    document.getElementById('reportReason').value = '';
    currentReportBlogId = null;
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

async function submitReport(blogId, type, customReason) {
    try {
        const response = await fetch('https://content-corner-8vf4.onrender.com/api/reports', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blog_id: parseInt(blogId),
                type: type,
                reason: customReason
            })
        });

        if (!response.ok) {
            throw new Error('Failed to submit report');
        }

        const data = await response.json();
        console.log('Report submitted:', data);

        // Show success message
        showSuccessModal('Report Submitted', 'Thank you for reporting. We will review this blog.');
        hideReportReasonModal();

    } catch (error) {
        console.error('Error submitting report:', error);
        showSuccessModal('Error', 'Failed to submit report. Please try again.');
    }
}

// Report modal event listeners
document.getElementById('reportYesBtn').addEventListener('click', function() {
    showReportReasonModal();
});

document.getElementById('reportNoBtn').addEventListener('click', function() {
    window.location.href = `blog.html?id=${currentReportBlogId}`;
});

document.getElementById('reportCancelBtn').addEventListener('click', function() {
    hideReportModal();
});

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

    submitReport(currentReportBlogId, type, customReason);
});

document.getElementById('cancelReportBtn').addEventListener('click', function() {
    hideReportReasonModal();
});