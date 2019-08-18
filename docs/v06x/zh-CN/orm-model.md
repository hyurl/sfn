<!-- title: ORM 模型; order: 5 -->
# 提示

历史版本中，SFN 曾使用 [Modelar](https://github.com/hyurl/modelar) 作为它的默认
ORM 系统，但由于在实践中发现存在一些问题，并且这不利于系统使用其他的 ORM 或者
MongoDB 数据库，因此从 v0.6 版本起，SFN 移除了所有与 Modelar 绑定的东西，并鼓励
使用者自己引入所青睐的 ORM 系统。