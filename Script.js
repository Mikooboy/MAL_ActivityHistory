// ==UserScript==
// @name         MAL Activity History
// @namespace    http://tampermonkey.net/
// @version      2.1
// @description  Shows your first and latest MAL acitivity for anime entries straigth on the anime page
// @author       Miko
// @match        https://myanimelist.net/anime/*
// @grant        GM_xmlhttpRequest
// @connect      myanimelist.net
// ==/UserScript==

(function() {
    'use strict';

    const animeId = window.location.pathname.split('/')[2];
    if (!animeId) return;

    GM_xmlhttpRequest({
        method: "GET",
        url: `https://myanimelist.net/ajaxtb.php?detailedaid=${animeId}`,
        onload: function(response) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(response.responseText, "text/html");

            // Find all watched date entries
            const epRows = doc.querySelectorAll('#eplayer .spaceit_pad');
            if (epRows.length > 0) {
                // Create container for watched dates
                const container = document.createElement('div');
                container.className = 'spaceit_pad';
                container.innerHTML = `<h2>Activity</h2><ul style="margin-top:5px; margin-bottom:5px">`;

                // Helper function to convert original date string to desired format
                function formatDate(originalDateStr) {
                    // Replace " at " to form a valid date string (e.g., "08/14/2022 20:20")
                    const cleanedDateStr = originalDateStr.replace(" at ", " ");
                    const dateObj = new Date(cleanedDateStr);
                    // Month names abbreviated
                    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    const m = monthNames[dateObj.getMonth()];
                    const d = dateObj.getDate();
                    const y = dateObj.getFullYear();
                    let hours = dateObj.getHours();
                    const minutes = dateObj.getMinutes();
                    const ampm = hours >= 12 ? 'PM' : 'AM';
                    hours = hours % 12;
                    hours = hours ? hours : 12; // if hour is 0, display as 12
                    return `${m} ${d}, ${y} ${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
                }

                // Function to extract episode info and date from a row
                function parseRow(row) {
                    const text = row.textContent.trim();
                    const dateMatch = text.match(/watched on (\d{2}\/\d{2}\/\d{4} at \d{2}:\d{2})/);
                    if (dateMatch) {
                        // Extract episode info (e.g., "Episode 1")
                        const epInfo = text.split(', watched')[0];
                        const originalDate = dateMatch[1];
                        const formattedDate = formatDate(originalDate);
                        return { info: epInfo, date: formattedDate };
                    }
                    return null;
                }

                if (epRows.length === 1) {
                    // Only one entry: label it as both first and latest
                    const data = parseRow(epRows[0]);
                    if (data) {
                        container.innerHTML += `<div class="spaceit_pad"><span class="dark_text">First & Latest:</span> ${data.date}`;
                    }
                } else {
                    // More than one entry: use the first and the last
                    const firstData = parseRow(epRows[0]);
                    const latestData = parseRow(epRows[epRows.length - 1]);
                    if (latestData) {
                        container.innerHTML += `<div class="spaceit_pad"><span class="dark_text">First:</span> ${latestData.date}</div>`;
                    }
                    if (firstData) {
                        container.innerHTML += `<div class="spaceit_pad"><span class="dark_text">Latest:</span> ${firstData.date}</div>`;
                    }
                }

                container.innerHTML += '</ul>';

                // Insert into info section (adjust the target element as needed)
                const detailsDiv = document.querySelector('.leftside .pt0');
                if (detailsDiv) {
                    detailsDiv.parentNode.insertBefore(container, detailsDiv.nextSibling);
                }
            }
        },
        onerror: function(error) {
            console.error('Error fetching watched dates:', error);
        }
    });
})();