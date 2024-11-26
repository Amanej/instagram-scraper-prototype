import puppeteer from 'puppeteer';

function timeout(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginToInstagram(username: string, password: string, targetProfile: string) {
  // Launch the browser
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  console.log('Opened new page');

  // Navigate to Instagram
  await page.goto('https://www.instagram.com/accounts/login/');

  console.log('Navigated to Instagram');

  // Wait for the cookie consent button to appear
  await page.waitForSelector('button:has-text("Avvis")', { timeout: 5000 }).catch(() => console.log('Cookie consent button not found'));

  // Click the cookie consent button if it exists
  try {
    await page.click('button:has-text("Avvis valgfrie informasjonskapsler")');
    console.log('Clicked cookie consent button');
  } catch (error) {
    console.log('Failed to click cookie consent button or button not found');
  }


  await page.waitForSelector('input[name="username"]');
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for a short time to allow the page to update after clicking the button
  // await page.waitForTimeout(2000);

  await page.waitForNavigation();

  // Navigate to the specified Instagram profile
  console.log('Navigating to the specified profile');
  await page.goto(targetProfile); // @TODO: Make this dynamic

  // Wait for the profile page to load
  await page.waitForSelector('h2');

  console.log('Profile page loaded successfully');

 page.locator('::-p-aria(72 følgere)').click(); // @TODO: Make this dynamic and into English

  // Wait for the followers list to load
  await page.waitForSelector('div[role="dialog"]');

  // Find the scrollable div with max-height: 400px
  const scrollableDiv = await page.$('div[style*="max-height: 400px"] > :nth-child(3)');

  const scrollToBottom = (div: any) => {
    div.scrollTop = div.scrollHeight;
  };

  const followers: any[] = [];

  const captureFollowers = async () => {
        // Capture the network requests
        const requestPromise = page.waitForResponse(response => response.url().includes('instagram.com/graphql/query/') && response.request().method() === 'GET');
    
        // Wait for the request to complete
        const response = await requestPromise;
        
        // Get the response data
        const responseData = await response.json();
        
        // Process the response data
        if (responseData && responseData.data && responseData.data.user && responseData.data.user.edge_followed_by) {
          const newFollowers = responseData.data.user.edge_followed_by.edges.map((edge: any) => edge.node.username);
          followers.push(...newFollowers);
          console.log(`Captured ${newFollowers.length} new followers. Total: ${followers.length}`);
        }
  }

  console.log("scrollableDiv ",scrollableDiv);
  scrollToBottom(scrollableDiv);
  await captureFollowers();

  /*
  [1,2,3].map(async() => {
    await timeout(5000);
  });
  */

  // Wait for a short time to ensure all content is loaded
  // await page.waitForTimeout(2000);

  // Optional: You can add more actions here, such as scraping profile information

  // Keep the browser open for manual inspection
  // When you're done, you can close the browser by uncommenting the following line:
  // await browser.close();
  /*
  // Wait for the login form to load

  console.log('Wait for user name input');

  // Fill in the username and password

  // Click the login button

  // Wait for navigation to complete

  console.log('Logged in successfully');

  // Keep the browser open
  // Close the browser when done:
  // await browser.close();
  */
}

// Usage
const username = ''; // TODO: Add username
const password = ''; // TODO: Add password
const targetProfile = ''; // TODO: Add target profile
loginToInstagram(username, password, targetProfile).catch(console.error);
