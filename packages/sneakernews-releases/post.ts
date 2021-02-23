type PostData = {
  date: Date | null;
  imgUrl: string | null;
  name: string | null;
  price: string | null;
  url: string | null;
};

class Post {
  date: Date | null;
  imgUrl: string | null;
  name: string | null;
  price: string | null;
  url: string | null;

  constructor(data: PostData) {
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
    return (
      this.date.getDate() === now.getDate() &&
      this.date.getMonth() === now.getMonth()
    );
  }

  static overall(posts: Post[]) {
    if (posts.length === 0) {
      return null;
    }

    return posts
      .map((post) => {
        const { name, price, url } = post;

        return `${url ? `[${name}](${url})` : name}${
          price ? ` – ${price}` : ''
        }`;
      })
      .join('\n');
  }
}

export default Post;
