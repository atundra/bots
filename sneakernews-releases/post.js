class Post {
	constructor(data) {
		this.date = data.date;
    this.imgUrl = data.imgUrl;
		this.name = data.name;
    this.price = data.price;
		this.url = data.url;
	}

	isReleaseToday() {
		if (!this.date) {
			return false;
		}

		const now = new Date();
		return this.date.getDate() === now.getDate() &&
        this.date.getMonth() === now.getMonth() &&
        this.date.getYear() === now.getYear();
	}

	/** @param {Array<Post>} posts */
	static overall(posts) {
		if (posts.length === 0) {
			return null;
		}

		return posts.map(post => {
			const {
				name,
				price,
				url,
		 	} = post;

			return `${url ? `[${name}](${url})` : name}${price ? ` – ${price}` : ''}`;
		}).join('\n');
	}
}

module.exports = Post;
