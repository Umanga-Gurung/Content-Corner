// Image preview functionality
const imageInput = document.getElementById('image-upload');
const previewContainer = document.getElementById('image-preview-container');
const previewImg = document.getElementById('image-preview');

if (imageInput) {
    imageInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                previewImg.src = '';
                previewContainer.style.display = 'none';
                imageInput.value = '';
                showSuccessModal('Error', 'Please select an image file.');
                return;
            }

            // Validate file size (max 5MB for blog images)
            if (file.size > 5 * 1024 * 1024) {
                previewImg.src = '';
                previewContainer.style.display = 'none';
                imageInput.value = '';
                showSuccessModal('Error', 'Image size should be less than 5MB.');
                return;
            }

            // If validation passes, show preview
            const reader = new FileReader();
            reader.onload = function(e) {
                previewImg.src = e.target.result;
                previewContainer.style.display = 'block';
            };
            reader.readAsDataURL(file);
        } else {
            previewImg.src = '';
            previewContainer.style.display = 'none';
        }
    });
}
// DOM elements
const imageUpload = document.getElementById('image-upload');
const titleInput = document.querySelector('.title-input');
const descriptionInput = document.querySelector('.description-input');
const storyInput = document.querySelector('.story-input');
const publishBtn = document.querySelector('.publish-btn');
const token = localStorage.getItem('authToken');
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

// Check if we're in edit mode
const urlParams = new URLSearchParams(window.location.search);
const editBlogId = urlParams.get('edit');
const isEditMode = !!editBlogId;

// Data object to store form data
let blogData = {
    image: null,
    title: '',
    description: '',
    story: '',
    existingImageUrl: ''
};

// Handle image upload
imageUpload.addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showSuccessModal('Error', 'Please select an image file.');
            imageInput.value = ''; // Clear the file input
            previewImg.src = ''; // Clear preview image
            previewContainer.style.display = 'none'; // Hide preview container
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            showSuccessModal('Error', 'Image size should be less than 2MB.');
            imageInput.value = ''; // Clear the file input
            blogData.image = null; // Clear the stored image
            previewImg.src = ''; // Clear preview image
            previewContainer.style.display = 'none'; // Hide preview container
            return;
        }

        blogData.image = file;
        console.log('Image selected:', file.name);
    }
});

// Handle title input
titleInput.addEventListener('input', function() {
    blogData.title = this.value.trim();
    console.log('Title updated:', blogData.title);
});

// Handle description input
descriptionInput.addEventListener('input', function() {
    blogData.description = this.value.trim();
    console.log('Description updated:', blogData.description);
});

// Handle story input
storyInput.addEventListener('input', function() {
    blogData.story = this.value.trim();
    console.log('Story updated:', blogData.story);
});

// Handle publish button
publishBtn.addEventListener('click', function() {
    // Validate form data
    if (!validateForm()) {
        return;
    }

    const modalTitle = isEditMode ? 'Update Post' : 'Publish Post';
    const modalMessage = isEditMode ? 'Are you sure you want to update this post?' : 'Are you sure you want to post it?';
    showlogoutModal(modalTitle, modalMessage);
});

// Validate form data
function validateForm() {
    // Get current input values for validation
    const currentTitle = titleInput.value.trim();
    const currentDescription = descriptionInput.value.trim();
    const currentStory = storyInput.value.trim();

    if (!currentTitle) {
        showSuccessModal('Error', 'Please enter a title for your blog post.');
        titleInput.focus();
        return false;
    }

    if (!currentDescription) {
        showSuccessModal('Error', 'Please enter a description for your blog post.');
        descriptionInput.focus();
        return false;
    }

    if (!currentStory) {
        showSuccessModal('Error', 'Please enter your story content.');
        storyInput.focus();
        return false;
    }

    // In edit mode, image is optional if there's an existing image
    if (!isEditMode && !blogData.image) {
        showSuccessModal('Error', 'Please select an image for your blog post.');
        return false;
    }

    return true;
}


function processBlogData() {
    console.log('=== Processing blog data ===');
    console.log('Edit mode:', isEditMode);
    console.log('Blog ID:', editBlogId);

    // IMPORTANT: Always get the latest values from inputs
    // In case blogData object is out of sync
    const currentTitle = titleInput.value.trim();
    const currentDescription = descriptionInput.value.trim();
    const currentStory = storyInput.value.trim();

    console.log('Current blogData object:', blogData);
    console.log('Current input values:');
    console.log('  Title:', currentTitle);
    console.log('  Description:', currentDescription);
    console.log('  Story:', currentStory);

    // Create FormData for file upload
    const formData = new FormData();

    // Only append image if a new one was selected
    if (blogData.image) {
        formData.append('image', blogData.image);
        console.log('Image attached:', blogData.image.name);
    } else {
        console.log('No new image - using existing');
    }

    // Use the CURRENT input values, not blogData
    formData.append('title', currentTitle);
    formData.append('description', currentDescription);
    formData.append('content', currentStory);

    console.log('FormData prepared with current input values');
    console.log('Sending to backend...');
    sendToBackend(formData);
}

function clearForm() {
    imageUpload.value = '';
    titleInput.value = '';
    descriptionInput.value = '';
    storyInput.value = '';
    blogData = {
        image: null,
        title: '',
        description: '',
        story: '',
    };
    console.log('Form cleared');
}


async function sendToBackend(formData) {
    const url = isEditMode ?
        `https://content-corner-8vf4.onrender.com/api/blog/${editBlogId}` :
        'https://content-corner-8vf4.onrender.com/api/blog';

    const method = 'POST';

    console.log('=== Sending to backend ===');
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Token present:', !!token);

    showLoading(true);

    try {
        // Always send FormData for both create and edit
        console.log('Sending FormData');
        for (let [key, value] of formData.entries()) {
            if (value instanceof File) {
                console.log(`  ${key}:`, value.name);
            } else {
                console.log(`  ${key}:`, value);
            }
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            credentials: 'include',
            body: formData
        });

        console.log('Response received:', response.status, response.statusText);

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Success response:', data);

        // Verify the data was actually updated
        if (data.data) {
            console.log('Updated blog data from server:');
            console.log('  Title:', data.data.title);
            console.log('  Description:', data.data.description);
            console.log('  Content:', data.data.content);
        }

        showLoading(false);
        const successMessage = isEditMode ? 'Post updated successfully' : 'Post published successfully';
        showSuccessModal(isEditMode ? 'Update Post' : 'Publish Post', successMessage);

        // Clean up localStorage after successful edit
        if (isEditMode) {
            console.log('Removing editBlogId from localStorage');
            localStorage.removeItem('editBlogId');
        } else {
            clearForm();
        }

        // Redirect with cache busting
        setTimeout(() => {
            if (isEditMode) {
                window.location.replace('profilepage.html?updated=' + Date.now());
            } else {
                window.location.replace('homepage.html?created=' + Date.now());
            }
        }, 1500);

    } catch (error) {
        console.error('Error occurred:', error);
        showLoading(false);
        const errorMessage = isEditMode ?
            `Error updating post: ${error.message}` :
            `Error publishing post: ${error.message}`;
        showSuccessModal('Error', errorMessage);
        // Clean up editBlogId from localStorage on error if in edit mode
        if (isEditMode) {
            localStorage.removeItem('editBlogId');
        }
    }
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

function closeModel() {
    const modal = document.getElementById('logoutModal');
    modal.style.display = 'none';
}

// Event listeners for modal
document.getElementById('cancelBtn').addEventListener('click', closeModel);
document.getElementById('logoutmodalOkBtn').addEventListener('click', function() {
    closeModel();
    processBlogData();
});
document.getElementById('logoutModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeModel();
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
    modal.style.display = 'none';
}

// Event listeners for modal
document.getElementById('closeModalBtn').addEventListener('click', hideModal);
document.getElementById('modalOkBtn').addEventListener('click', hideModal);
document.getElementById('successModal').addEventListener('click', function(e) {
    if (e.target === this) {
        hideModal();
    }
});

// Show/hide loading spinner
function showLoading(show) {
    const formContainer = document.querySelector('.container');
    const loadingSpinner = document.getElementById('loading');

    if (loadingSpinner) {
        loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    if (formContainer) {
        formContainer.style.opacity = show ? '0.5' : '1';
        formContainer.style.pointerEvents = show ? 'none' : 'auto';
    }
}

// Fetch existing blog data if in edit mode
async function fetchBlogData(blogId) {
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
            throw new Error('Failed to fetch blog data');
        }

        const result = await response.json();
        const blog = result.data;

        // Populate form with existing data
        titleInput.value = blog.title;
        descriptionInput.value = blog.description;
        storyInput.value = blog.content;

        // Update blogData object to match form values
        blogData.title = blog.title;
        blogData.description = blog.description;
        blogData.story = blog.content;
        blogData.existingImageUrl = blog.image_path;

        console.log('Form populated with blog data');
        console.log('blogData after loading:', blogData);

        // Show existing image preview
        if (blog.image_path) {
            previewImg.src = blog.image_path;
            previewContainer.style.display = 'block';
        }

        // Update button text
        publishBtn.textContent = 'Update Post';

        console.log('Blog data loaded for editing:', blog);

        showLoading(false);
    } catch (error) {
        console.error('Error fetching blog data:', error);
        showLoading(false);
        showSuccessModal('Error', 'Failed to load blog data. Redirecting to profile...');
        setTimeout(() => {
            window.location.href = 'profilepage.html';
        }, 2000);
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    if (isEditMode && editBlogId) {
        fetchBlogData(editBlogId);
    }
});

// Clean up editBlogId from localStorage when navigating away without saving
window.addEventListener('beforeunload', function() {
    // Only clean up if still in edit mode and the blog wasn't successfully saved
    // (successful save already removes editBlogId in the publishBlog function)
    if (isEditMode && localStorage.getItem('editBlogId')) {
        localStorage.removeItem('editBlogId');
    }
});