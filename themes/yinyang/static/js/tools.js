function toggleContents(event) {
    // var contentBody = document.querySelector("#content-body");
    var contentBody = event.target.parentElement.lastElementChild;
    if (contentBody.style.display === "none") {
        contentBody.style.display = "block";
    } else {
        contentBody.style.display = "none";
    }
}