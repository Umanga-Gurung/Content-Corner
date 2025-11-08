const likeBtns = document.querySelectorAll('.btn-like');
const commentBtns = document.querySelectorAll('.btn-comment');
const flagBtns = document.querySelectorAll('.btn-flag');
const editBtns = document.querySelectorAll('.btn-edit');
const deleteBtns = document.querySelectorAll('.btn-delete');
const loadingSpinner = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const retryBtn = document.getElementById('retry-btn');
const avatar = document.getElementById('avatar');

// Render avatar with profile picture or initial
function renderNavbarAvatar() {
    const username = localStorage.getItem('username');
    const profilePicture = localStorage.getItem('userProfilePicture');

    if (profilePicture) {
        avatar.innerHTML = `<img src="${profilePicture}" alt="${username}">`;
    } else {
        avatar.textContent = username.charAt(0).toUpperCase();
    }
}

renderNavbarAvatar();

const token = localStorage.getItem('authToken');
const userId = localStorage.getItem('userId');
const blogsContainer = document.getElementById('blogs');
const userAvatar = document.querySelector('.profile-avatar');
const userName = document.querySelector('.profile-name');
const profileDesc = document.querySelector('.profile-desc');

// Store current user data
let currentUserData = {
    username: '',
    description: ''
};

// Flag to track if user wants to remove profile picture
let removeProfilePicture = false;

// Fetch user profile data
async function fetchUserProfile() {
    try {
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('User profile:', result);

        const userData = result.data;

        // Store user data globally
        currentUserData = {
            username: userData.username || '',
            description: userData.description || '',
            profile_picture: userData.profile_picture || null
        };

        // Update username from API
        if (userData.username) {
            userName.textContent = userData.username;

            // Use profile picture if available, otherwise use initial
            if (userData.profile_picture) {
                userAvatar.innerHTML = `<img src="${userData.profile_picture}" alt="${userData.username}">`;
            } else {
                userAvatar.textContent = userData.username.charAt(0).toUpperCase();
            }
        }

        // Update profile description
        if (userData.description) {
            profileDesc.textContent = userData.description;
        } else {
            profileDesc.innerHTML = '<em style="color: #888;">No bio yet. Click "Edit Profile" to add one!</em>';
        }

    } catch (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to localStorage if API fails
        userName.textContent = localStorage.getItem('username');
        userAvatar.textContent = localStorage.getItem('username').charAt(0).toUpperCase();
        profileDesc.innerHTML = '<em style="color: #888;">Unable to load bio.</em>';
    }
}

// Fetch Function
async function fetchBlogs() {
    try {
        showLoading(true);
        hideError();

        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/blog?user_id=${userId}`, {
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
        console.log(blogs);
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
    blogs.data.forEach(blog => {

        const blogID = blog.id;
        const avatarInitial = blog.username.charAt(0).toUpperCase();
        const username = blog.username;
        const title = blog.title;
        const uploadDate = formatToMonthDay(blog.created_at);
        const summary = blog.description;
        const likes = blog.like_count;
        const comments = blog.comment_count;
        const imgURL = blog.image_path;
        const profile_picture = blog.profile_picture;
        const likedByCurrentUser = blog.liked_by_current_user;
        const reportedByCurrentUser = blog.reported_by_current_user;

        // Create avatar HTML - use profile picture if available, otherwise use initial
        const avatarHTML = profile_picture ?
            `<img src="${profile_picture}" alt="${username}">` :
            avatarInitial;

        // Determine like icon class based on liked status
        const likeIconClass = likedByCurrentUser ? 'fa-solid' : 'fa-regular';

        // Determine flag icon class and button disabled state
        const flagIconClass = reportedByCurrentUser ? 'fa-solid' : 'fa-regular';
        const flagButtonDisabled = reportedByCurrentUser ? 'disabled' : '';

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
        <div><button class="btn btn-like" data-section="${blogID}"><i class="${likeIconClass} fa-heart like-icon" data-section="${blogID}"></i></button><span class="like-count" data-section="${blogID}">${likes}</span></div>
        <div><button class="btn btn-comment" data-section="${blogID}"><i class="fa-regular fa-comment comment-icon" data-section="${blogID}"></i></button><span class="comment-count" data-section="${blogID}">${comments}</span></div>
        <div><button class="btn btn-flag" data-section="${blogID}" ${flagButtonDisabled}><i class="${flagIconClass} fa-flag flag-icon" data-section="${blogID}"></i></button></div>
        <div><button class="btn btn-edit" data-section="${blogID}"><i class="fa-solid fa-pen-to-square"></i></button></div>
        <div><button class="btn btn-delete" data-section="${blogID}"><i class="fa-solid fa-trash"></i></button></div>
      </div>
    </div>
    <div class="blog-image">
      <img src="${imgURL}" alt="Blog Image">
    </div>
      </article>
    </section>
    `
        blogsContainer.insertAdjacentHTML('beforeend', HTML);
    });
    setupEventHandlers();
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


// Setup event handlers for dynamically added buttons
function setupEventHandlers() {
    //     // Handle like buttons
    //     document.querySelectorAll('.btn-like').forEach(likeBtn => {
    //         likeBtn.addEventListener('click', async(e) => {
    //             e.stopPropagation();
    //             const blogId = likeBtn.getAttribute('data-section');
    //             const likeIcon = likeBtn.querySelector('.like-icon');
    //             const likeCount = document.querySelector(`.like-count[data-section="${blogId}"]`);

    //             try {
    //                 const response = await fetch(`https://content-corner-8vf4.onrender.com/api/blog/${blogId}/like`, {
    //                     method: 'POST',
    //                     headers: {
    //                         'Authorization': `Bearer ${token}`,
    //                         'Content-Type': 'application/json'
    //                     }
    //                 });

    //                 if (!response.ok) throw new Error('Failed to update like');

    //                 const data = await response.json();
    //                 likeIcon.classList.toggle('fa-solid');
    //                 likeIcon.classList.toggle('fa-regular');
    //                 likeCount.textContent = data.likes || parseInt(likeCount.textContent) + (likeIcon.classList.contains('fa-solid') ? 1 : -1);
    //             } catch (error) {
    //                 console.error('Error updating like:', error);
    //                 showSuccessModal('Error', 'Failed to update like. Please try again.');
    //             }
    //         });
    //     });

    //     // Handle comment buttons
    //     document.querySelectorAll('.btn-comment').forEach(commentBtn => {
    //         commentBtn.addEventListener('click', (e) => {
    //             e.stopPropagation();
    //             const blogId = commentBtn.getAttribute('data-section');
    //             window.location.href = `blog.html?id=${blogId}#comments`;
    //         });
    //     });

    //     // Handle flag buttons
    //     document.querySelectorAll('.btn-flag').forEach(flagBtn => {
    //         flagBtn.addEventListener('click', async(e) => {
    //             e.stopPropagation();
    //             const blogId = flagBtn.getAttribute('data-section');
    //             const flagIcon = flagBtn.querySelector('.flag-icon');

    //             try {
    //                 const response = await fetch(`https://content-corner-8vf4.onrender.com/api/blog/${blogId}/flag`, {
    //                     method: 'POST',
    //                     headers: {
    //                         'Authorization': `Bearer ${token}`,
    //                         'Content-Type': 'application/json'
    //                     }
    //                 });

    //                 if (!response.ok) throw new Error('Failed to flag blog');

    //                 flagIcon.classList.toggle('fa-solid');
    //                 flagIcon.classList.toggle('fa-regular');
    //                 showSuccessModal('Success', flagIcon.classList.contains('fa-solid') ? 'Blog has been flagged' : 'Flag has been removed');
    //             } catch (error) {
    //                 console.error('Error flagging blog:', error);
    //                 showSuccessModal('Error', 'Failed to flag blog. Please try again.');
    //             }
    //         });
    //     });

    //     // Handle edit buttons
    //     document.querySelectorAll('.btn-edit').forEach(editBtn => {
    //         editBtn.addEventListener('click', (e) => {
    //             e.stopPropagation();
    //             const blogId = editBtn.getAttribute('data-section');
    //             window.location.href = `editblog.html?id=${blogId}`;
    //         });
    //     });

    // Handle edit buttons
    document.querySelectorAll('.btn-edit').forEach(editBtn => {
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const blogId = editBtn.getAttribute('data-section');
            // Store blog ID for editing
            localStorage.setItem('editBlogId', blogId);
            window.location.href = `postblog.html?edit=${blogId}`;
        });
    });

    // Handle delete buttons
    document.querySelectorAll('.btn-delete').forEach(deleteBtn => {
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const blogId = deleteBtn.getAttribute('data-section');
            localStorage.setItem('blogId', blogId);
            showlogoutModal('Delete Blog', 'Are you sure you want to delete this blog?');
        });
    });

    // Add click handlers for blog navigation
    addBlogClickHandlers();
}

// Handle Section clicks
function addBlogClickHandlers() {
    const blogSections = document.querySelectorAll('.blog');
    blogSections.forEach(blog => {
        blog.style.cursor = 'pointer';
        blog.addEventListener('click', (e) => {
            // Don't redirect if clicking on action buttons (like, comment, flag, edit, delete)
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

async function deleteBlog() {
    const blogId = localStorage.getItem('blogId');
    if (!blogId || !token) {
        showSuccessModal('Error', 'Invalid blog ID or not authenticated');
        return;
    }

    try {
        showLoading(true);
        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/blog/${blogId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.removeItem('blogId');
            showSuccessModal('Success', 'Blog deleted successfully');
            // Remove the blog section from DOM
            const blogSection = document.getElementById(`section-${blogId}`);
            if (blogSection) {
                blogSection.remove();
            }
        } else {
            throw new Error(data.message || 'Failed to delete blog');
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        showSuccessModal('Error', 'Failed to delete blog. Please try again.');
        // Clean up blogId from localStorage on error
        localStorage.removeItem('blogId');
    } finally {
        showLoading(false);
    }
}








function showLoading(show) {
    loadingSpinner.style.display = show ? 'flex' : 'none';
}


//LogOut Modal functionality
function showlogoutModal(title, message) {
    const modal = document.getElementById('logoutModal');
    const modalTitle = document.getElementById('logoutmodalTitle');
    const modalMessage = document.getElementById('logoutmodalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

function closeModel(shouldCleanup = false) {
    const modal = document.getElementById('logoutModal');
    modal.style.display = 'none';
    // Clean up blogId from localStorage only when canceled, not when confirmed
    if (shouldCleanup) {
        localStorage.removeItem('blogId');
    }
}

// Event listeners for modal
document.getElementById('cancelBtn').addEventListener('click', function() {
    closeModel(true); // Clean up when canceled
});
document.getElementById('logoutmodalOkBtn').addEventListener('click', function() {
    closeModel(false); // Don't clean up - deleteBlog() will handle it
    deleteBlog();
});
document.getElementById('logoutModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModel(true); // Clean up when clicking outside (acts as cancel)
    }
});

// Modal functionality
function showSuccessModal(title, message) {
    const modal = document.getElementById('successModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalMessage = document.getElementById('modalMessage');

    modalTitle.textContent = title;
    modalMessage.textContent = message;
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('successModal');
    const modalMessage = document.getElementById('modalMessage');
    modal.style.display = 'none';
    if (modalMessage.textContent.includes('Blog Deleted Successfully')) {
        window.location.reload();
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


// Fetching Blogs on page Initialization
document.addEventListener('DOMContentLoaded', function() {
    fetchUserProfile();
    fetchBlogs();
});

// Edit Profile Modal Functions
function showEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    const usernameInput = document.getElementById('usernameInput');
    const bioTextarea = document.getElementById('bioTextarea');
    const usernameError = document.getElementById('usernameError');
    const profilePicturePreview = document.getElementById('profilePicturePreview');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const removeBtn = document.getElementById('removeProfilePictureBtn');

    // Pre-populate fields with existing data
    usernameInput.value = currentUserData.username || '';
    bioTextarea.value = currentUserData.description || '';

    // Show current profile picture or placeholder
    if (currentUserData.profile_picture) {
        profilePicturePreview.innerHTML = `<img src="${currentUserData.profile_picture}" alt="Profile Picture">`;
        profilePicturePreview.classList.remove('empty');
        removeBtn.style.display = 'flex'; // Show remove button
    } else {
        profilePicturePreview.innerHTML = '<span>No image</span>';
        profilePicturePreview.classList.add('empty');
        removeBtn.style.display = 'none'; // Hide remove button
    }

    // Clear file input
    profilePictureInput.value = '';

    // Reset remove flag
    removeProfilePicture = false;

    // Clear any previous error
    usernameError.textContent = '';

    modal.style.display = 'flex';
}

function hideEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.style.display = 'none';
}

async function updateUserProfile() {
    const usernameInput = document.getElementById('usernameInput');
    const bioTextarea = document.getElementById('bioTextarea');
    const profilePictureInput = document.getElementById('profilePictureInput');
    const usernameError = document.getElementById('usernameError');
    const newUsername = usernameInput.value.trim();
    const newBio = bioTextarea.value.trim();

    // Clear previous error
    usernameError.textContent = '';

    // Validate username
    if (!newUsername) {
        usernameError.textContent = 'Username cannot be empty.';
        usernameInput.focus();
        return;
    }

    try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('id', parseInt(userId));
        formData.append('username', newUsername);
        formData.append('description', newBio);

        // Handle profile picture
        if (removeProfilePicture) {
            // When removing, add a flag to tell backend to remove it
            formData.append('remove_profile_picture', '1');
            console.log('Removing profile picture - sending remove flag');
        } else if (profilePictureInput.files[0]) {
            // When uploading new picture
            formData.append('profile_picture', profilePictureInput.files[0]);
            console.log('Uploading new profile picture');
        }
        // If neither removing nor uploading, don't include any profile_picture field

        console.log('FormData contents:');
        for (let [key, value] of formData.entries()) {
            console.log(key, ':', value);
        }

        const response = await fetch(`https://content-corner-8vf4.onrender.com/api/user`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            // Check if it's a username validation error
            if (errorData.message && errorData.message.toLowerCase().includes('username')) {
                usernameError.textContent = errorData.message;
                usernameInput.focus();
                return;
            }
            throw new Error(errorData.message || 'Failed to update profile');
        }

        const result = await response.json();
        console.log('Profile updated:', result);

        // Update stored user data
        currentUserData.username = newUsername;
        currentUserData.description = newBio;

        // Update profile picture if a new one was uploaded
        if (profilePictureInput.files[0] && result.data && result.data.profile_picture) {
            currentUserData.profile_picture = result.data.profile_picture;
            // Update localStorage for navbar across all pages
            localStorage.setItem('userProfilePicture', result.data.profile_picture);
        }
        // Handle profile picture removal
        else if (removeProfilePicture) {
            currentUserData.profile_picture = null;
            localStorage.removeItem('userProfilePicture');
        }

        // Update the UI
        userName.textContent = newUsername;

        // Update avatar - keep existing profile picture if available, otherwise use new initial
        if (currentUserData.profile_picture) {
            userAvatar.innerHTML = `<img src="${currentUserData.profile_picture}" alt="${newUsername}">`;
        } else {
            userAvatar.textContent = newUsername.charAt(0).toUpperCase();
        }

        // Update navbar avatar
        renderNavbarAvatar();

        if (newBio) {
            profileDesc.textContent = newBio;
        } else {
            profileDesc.innerHTML = '<em style="color: #888;">No bio yet. Click "Edit Profile" to add one!</em>';
        }

        // Update localStorage
        localStorage.setItem('username', newUsername);

        hideEditProfileModal();
        showSuccessModal('Success!', 'Your profile has been updated successfully.');

    } catch (error) {
        console.error('Error updating profile:', error);
        showSuccessModal('Error', 'Failed to update profile. Please try again.');
    }
}

// Edit Profile Event Listeners
document.getElementById('editProfileBtn').addEventListener('click', showEditProfileModal);
document.getElementById('saveProfileBtn').addEventListener('click', updateUserProfile);
document.getElementById('cancelProfileBtn').addEventListener('click', hideEditProfileModal);
document.getElementById('editProfileModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideEditProfileModal();
    }
});

// Clear username error when user starts typing
document.getElementById('usernameInput').addEventListener('input', function() {
    document.getElementById('usernameError').textContent = '';
});
// Preview profile picture when selected
document.getElementById('profilePictureInput').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const preview = document.getElementById('profilePicturePreview');
    const fileInput = e.target;
    const removeBtn = document.getElementById('removeProfilePictureBtn');

    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            preview.innerHTML = '<span>No image</span>';
            preview.classList.add('empty');
            fileInput.value = '';
            showSuccessModal('Error', 'Please select an image file.');
            return;
        }

        // Validate file size (max 2MB for profile pictures)
        if (file.size > 2 * 1024 * 1024) {
            preview.innerHTML = '<span>No image</span>';
            preview.classList.add('empty');
            fileInput.value = '';
            showSuccessModal('Error', 'Profile picture size should be less than 2MB.');
            return;
        }

        // If validation passes, show preview
        const reader = new FileReader();
        reader.onload = function(event) {
            preview.innerHTML = `<img src="${event.target.result}" alt="Profile Picture Preview">`;
            preview.classList.remove('empty');
            removeBtn.style.display = 'flex'; // Show remove button when image is selected
            removeProfilePicture = false; // Reset remove flag
        };
        reader.readAsDataURL(file);
    }
});

// Remove profile picture button
document.getElementById('removeProfilePictureBtn').addEventListener('click', function() {
    const preview = document.getElementById('profilePicturePreview');
    const fileInput = document.getElementById('profilePictureInput');
    const removeBtn = document.getElementById('removeProfilePictureBtn');

    // Clear preview
    preview.innerHTML = '<span>No image</span>';
    preview.classList.add('empty');

    // Clear file input
    fileInput.value = '';

    // Hide remove button
    removeBtn.style.display = 'none';

    // Set flag to remove profile picture
    removeProfilePicture = true;
});