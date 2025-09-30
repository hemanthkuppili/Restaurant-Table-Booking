// auth.js
function handleCredentialResponse(response) {
    console.log('handleCredentialResponse called with:', response);
    if (!response || !response.credential) {
        console.error('No credential received from Google Sign-In');
        return;
    }
    try {
        const userInfo = parseJwt(response.credential);
        console.log('Parsed user info:', userInfo);
        const user = {
            googleId: userInfo.sub,
            name: userInfo.name || 'User',
            email: userInfo.email,
            picture: userInfo.picture,
            isGuest: false
        };

        // Send user data to backend
        fetch('/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...user, credential: response.credential })
        })
        .then(response => response.json())
        .then(data => {
            console.log('User saved to backend:', data);
            localStorage.setItem('currentUser', JSON.stringify(user));
            updateUserProfileUI(user);
        })
        .catch(error => console.error('Error saving user to backend:', error));

    } catch (error) {
        console.error('Error processing Google credential:', error);
    }
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c =>
            '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join(''));
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error parsing JWT:', error);
        return {};
    }
}

function updateUserProfileUI(user) {
    console.log('Updating UI with user:', user);
    const userProfile = document.getElementById('user-profile');
    const userName = document.getElementById('user-name');
    const userPicture = document.getElementById('user-picture');
    const loginDropdown = document.getElementById('login-dropdown');
    const ordersLink = document.getElementById('orders-link');

    if (!userProfile || !userName || !userPicture || !loginDropdown || !ordersLink) {
        console.error('Required DOM elements for user profile UI are missing');
        return;
    }

    if (user) {
        userName.textContent = user.name;
        userPicture.src = user.picture || 'https://via.placeholder.com/30';
        userProfile.style.display = 'flex';
        loginDropdown.style.display = 'none';
        ordersLink.style.display = user.isGuest ? 'none' : 'block';
    } else {
        userProfile.style.display = 'none';
        loginDropdown.style.display = 'block';
        ordersLink.style.display = 'block';
    }
}

function signOut() {
    console.log('Sign out triggered');
    localStorage.removeItem('currentUser');
    updateUserProfileUI(null);
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.disableAutoSelect();
    }
    window.location.reload();
}

function googleSignIn() {
    console.log('googleSignIn triggered, window.location.origin:', window.location.origin);
    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google API not loaded');
        alert('Google Sign-In is not available. Please try again later.');
        return;
    }
    google.accounts.id.prompt((notification) => {
        console.log('Prompt notification:', notification);
        if (notification.isNotDisplayed()) {
            console.error('Prompt not displayed:', notification.getNotDisplayedReason());
        } else if (notification.isSkippedMoment()) {
            console.log('Prompt skipped:', notification.getSkippedReason());
        } else if (notification.isDismissedMoment()) {
            console.log('Prompt dismissed:', notification.getDismissedReason());
        }
    });
}

function showGuestModal() {
    console.log('Showing guest modal');
    const modal = document.getElementById('guestModal');
    if (modal) modal.style.display = 'block';
}

function submitGuestName() {
    console.log('submitGuestName called');
    const guestNameInput = document.getElementById('guestNameInput');
    const name = guestNameInput.value.trim();
    if (name) {
        const guestUser = {
            id: 'guest_' + Date.now(),
            name: name,
            email: 'guest@plantopia.com',
            picture: 'https://via.placeholder.com/30',
            isGuest: true
        };
        localStorage.setItem('currentUser', JSON.stringify(guestUser));
        updateUserProfileUI(guestUser);
        document.getElementById('guestModal').style.display = 'none';
        guestNameInput.value = '';
    } else {
        alert('Please enter a name');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing auth');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        console.log('Found current user:', currentUser);
        updateUserProfileUI(currentUser);
    }

    if (typeof google === 'undefined' || !google.accounts) {
        console.error('Google API script not loaded');
        return;
    }

    console.log('Initializing Google Sign-In with client_id:', '393903945324-arkffhco0ppjkder7mvlci55hfbv716g.apps.googleusercontent.com');
    google.accounts.id.initialize({
        client_id: '393903945324-arkffhco0ppjkder7mvlci55hfbv716g.apps.googleusercontent.com',
        callback: handleCredentialResponse,
        auto_select: false
    });

    // Handle dropdown hover (optional, enhance with JavaScript)
    const dropdowns = document.getElementsByClassName('dropdown');
    for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].addEventListener('mouseover', function() {
            this.querySelector('.dropdown-content').style.display = 'block';
        });
        dropdowns[i].addEventListener('mouseout', function() {
            this.querySelector('.dropdown-content').style.display = 'none';
        });
    }

    window.onclick = function(event) {
        const modal = document.getElementById('guestModal');
        if (event.target === modal) {
            modal.style.display = 'none';
            document.getElementById('guestNameInput').value = '';
        }
    };
});