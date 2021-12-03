function toggleContents() {
    var contentBody = document.querySelector("#content-body");
    console.log(contentBody)
    if (contentBody.style.display === "none") {
        contentBody.style.display = "block";
    } else {
        contentBody.style.display = "none";
    }
}