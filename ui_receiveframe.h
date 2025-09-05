/********************************************************************************
** Form generated from reading UI file 'receiveframe.ui'
**
** Created by: Qt User Interface Compiler version 5.15.16
**
** WARNING! All changes made in this file will be lost when recompiling UI file!
********************************************************************************/

#ifndef UI_RECEIVEFRAME_H
#define UI_RECEIVEFRAME_H

#include <QtCore/QVariant>
#include <QtWidgets/QApplication>
#include <QtWidgets/QFrame>
#include <QtWidgets/QGridLayout>
#include <QtWidgets/QGroupBox>
#include <QtWidgets/QHBoxLayout>
#include <QtWidgets/QLabel>
#include <QtWidgets/QPushButton>
#include <QtWidgets/QTextBrowser>
#include <QtWidgets/QVBoxLayout>

QT_BEGIN_NAMESPACE

class Ui_ReceiveFrame
{
public:
    QVBoxLayout *verticalLayout;
    QLabel *label;
    QGroupBox *groupBox;
    QGridLayout *gridLayout;
    QGroupBox *seedBox;
    QVBoxLayout *verticalLayout_4;
    QLabel *label_7;
    QFrame *line;
    QTextBrowser *m_seed;
    QGroupBox *groupBox_6;
    QHBoxLayout *horizontalLayout_5;
    QPushButton *m_copySeedButton;
    QPushButton *m_backButton_2;
    QGroupBox *introBox;
    QVBoxLayout *verticalLayout_3;
    QLabel *label_10;
    QFrame *line_2;
    QGroupBox *groupBox_8;
    QHBoxLayout *horizontalLayout_6;
    QGroupBox *groupBox_7;
    QVBoxLayout *verticalLayout_6;
    QLabel *label_3;
    QLabel *label_4;
    QLabel *label_8;
    QLabel *label_9;
    QGroupBox *groupBox_3;
    QHBoxLayout *horizontalLayout_2;
    QPushButton *m_showSeed;
    QPushButton *m_backButton;
    QLabel *label_12;
    QGroupBox *groupBox_4;
    QHBoxLayout *horizontalLayout_3;
    QPushButton *m_showPrivate;
    QPushButton *m_showGUI;
    QLabel *emptyLabelForAlignmentTop;
    QGroupBox *guiKeyBox;
    QVBoxLayout *verticalLayout_2;
    QLabel *label_2;
    QFrame *line_3;
    QGroupBox *groupBox_9;
    QHBoxLayout *horizontalLayout_7;
    QTextBrowser *m_guiKey;
    QGroupBox *groupBox_2;
    QHBoxLayout *horizontalLayout;
    QPushButton *m_copyGUIKeyButton;
    QPushButton *m_backButton_3;
    QGroupBox *privateKeyBox;
    QVBoxLayout *verticalLayout_5;
    QLabel *label_5;
    QTextBrowser *m_spendKey;
    QLabel *label_6;
    QTextBrowser *m_viewKey;
    QGroupBox *groupBox_5;
    QHBoxLayout *horizontalLayout_4;
    QPushButton *m_copySpendKeyButton;
    QPushButton *m_copyViewKeyButton;
    QPushButton *m_backButton_4;

    void setupUi(QFrame *ReceiveFrame)
    {
        if (ReceiveFrame->objectName().isEmpty())
            ReceiveFrame->setObjectName(QString::fromUtf8("ReceiveFrame"));
        ReceiveFrame->resize(1270, 700);
        ReceiveFrame->setMinimumSize(QSize(1270, 700));
        ReceiveFrame->setStyleSheet(QString::fromUtf8("border: 0px;\n"
"background-color: #282d31;\n"
"color: #ddd;"));
        ReceiveFrame->setFrameShape(QFrame::StyledPanel);
        ReceiveFrame->setFrameShadow(QFrame::Raised);
        verticalLayout = new QVBoxLayout(ReceiveFrame);
        verticalLayout->setObjectName(QString::fromUtf8("verticalLayout"));
        verticalLayout->setContentsMargins(0, 0, 0, 0);
        label = new QLabel(ReceiveFrame);
        label->setObjectName(QString::fromUtf8("label"));
        QFont font;
        label->setFont(font);
        label->setStyleSheet(QString::fromUtf8("color: #fff; \n"
"font-size: 22px;"));
        label->setAlignment(Qt::AlignCenter);
        label->setMargin(40);

        verticalLayout->addWidget(label);

        groupBox = new QGroupBox(ReceiveFrame);
        groupBox->setObjectName(QString::fromUtf8("groupBox"));
        groupBox->setMinimumSize(QSize(1200, 560));
        groupBox->setMaximumSize(QSize(16777215, 16777215));
        gridLayout = new QGridLayout(groupBox);
        gridLayout->setObjectName(QString::fromUtf8("gridLayout"));
        seedBox = new QGroupBox(groupBox);
        seedBox->setObjectName(QString::fromUtf8("seedBox"));
        seedBox->setStyleSheet(QString::fromUtf8(""));
        verticalLayout_4 = new QVBoxLayout(seedBox);
        verticalLayout_4->setObjectName(QString::fromUtf8("verticalLayout_4"));
        label_7 = new QLabel(seedBox);
        label_7->setObjectName(QString::fromUtf8("label_7"));
        label_7->setFont(font);
        label_7->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"font-size: 19px;\n"
""));
        label_7->setAlignment(Qt::AlignCenter);

        verticalLayout_4->addWidget(label_7);

        line = new QFrame(seedBox);
        line->setObjectName(QString::fromUtf8("line"));
        line->setStyleSheet(QString::fromUtf8("background-color: #333;"));
        line->setFrameShape(QFrame::HLine);
        line->setFrameShadow(QFrame::Sunken);

        verticalLayout_4->addWidget(line);

        m_seed = new QTextBrowser(seedBox);
        m_seed->setObjectName(QString::fromUtf8("m_seed"));
        m_seed->setMinimumSize(QSize(800, 0));
        m_seed->setFont(font);
        m_seed->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"font-size: 16px;"));

        verticalLayout_4->addWidget(m_seed, 0, Qt::AlignHCenter);

        groupBox_6 = new QGroupBox(seedBox);
        groupBox_6->setObjectName(QString::fromUtf8("groupBox_6"));
        horizontalLayout_5 = new QHBoxLayout(groupBox_6);
        horizontalLayout_5->setObjectName(QString::fromUtf8("horizontalLayout_5"));
        m_copySeedButton = new QPushButton(groupBox_6);
        m_copySeedButton->setObjectName(QString::fromUtf8("m_copySeedButton"));
        m_copySeedButton->setMinimumSize(QSize(210, 30));
        m_copySeedButton->setMaximumSize(QSize(210, 30));
        m_copySeedButton->setFont(font);
        m_copySeedButton->setStyleSheet(QString::fromUtf8("QPushButton#m_copySeedButton\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_copySeedButton:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout_5->addWidget(m_copySeedButton);

        m_backButton_2 = new QPushButton(groupBox_6);
        m_backButton_2->setObjectName(QString::fromUtf8("m_backButton_2"));
        m_backButton_2->setMinimumSize(QSize(210, 30));
        m_backButton_2->setMaximumSize(QSize(210, 30));
        m_backButton_2->setFont(font);
        m_backButton_2->setStyleSheet(QString::fromUtf8("QPushButton#m_backButton_2\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_backButton_2:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout_5->addWidget(m_backButton_2);


        verticalLayout_4->addWidget(groupBox_6, 0, Qt::AlignHCenter);


        gridLayout->addWidget(seedBox, 0, 0, 1, 1);

        introBox = new QGroupBox(groupBox);
        introBox->setObjectName(QString::fromUtf8("introBox"));
        introBox->setMinimumSize(QSize(0, 50));
        verticalLayout_3 = new QVBoxLayout(introBox);
        verticalLayout_3->setObjectName(QString::fromUtf8("verticalLayout_3"));
        label_10 = new QLabel(introBox);
        label_10->setObjectName(QString::fromUtf8("label_10"));
        label_10->setFont(font);
        label_10->setStyleSheet(QString::fromUtf8("color: #ddd; font-size: 19px;"));
        label_10->setAlignment(Qt::AlignCenter);

        verticalLayout_3->addWidget(label_10);

        line_2 = new QFrame(introBox);
        line_2->setObjectName(QString::fromUtf8("line_2"));
        line_2->setStyleSheet(QString::fromUtf8("background-color: #333;"));
        line_2->setFrameShape(QFrame::HLine);
        line_2->setFrameShadow(QFrame::Sunken);

        verticalLayout_3->addWidget(line_2);

        groupBox_8 = new QGroupBox(introBox);
        groupBox_8->setObjectName(QString::fromUtf8("groupBox_8"));
        groupBox_8->setAlignment(Qt::AlignCenter);
        horizontalLayout_6 = new QHBoxLayout(groupBox_8);
        horizontalLayout_6->setObjectName(QString::fromUtf8("horizontalLayout_6"));
        groupBox_7 = new QGroupBox(groupBox_8);
        groupBox_7->setObjectName(QString::fromUtf8("groupBox_7"));
        groupBox_7->setMinimumSize(QSize(0, 0));
        groupBox_7->setMaximumSize(QSize(500, 16777215));
        groupBox_7->setAlignment(Qt::AlignCenter);
        verticalLayout_6 = new QVBoxLayout(groupBox_7);
        verticalLayout_6->setObjectName(QString::fromUtf8("verticalLayout_6"));
        label_3 = new QLabel(groupBox_7);
        label_3->setObjectName(QString::fromUtf8("label_3"));
        label_3->setMinimumSize(QSize(0, 50));
        label_3->setFont(font);
        label_3->setStyleSheet(QString::fromUtf8("font-size: 16px;\n"
"margin-left: 3em;"));

        verticalLayout_6->addWidget(label_3);

        label_4 = new QLabel(groupBox_7);
        label_4->setObjectName(QString::fromUtf8("label_4"));
        label_4->setMinimumSize(QSize(0, 50));
        label_4->setFont(font);
        label_4->setStyleSheet(QString::fromUtf8("font-size: 16px;\n"
"margin-left: 3em;"));

        verticalLayout_6->addWidget(label_4);

        label_8 = new QLabel(groupBox_7);
        label_8->setObjectName(QString::fromUtf8("label_8"));
        label_8->setMinimumSize(QSize(0, 50));
        label_8->setFont(font);
        label_8->setStyleSheet(QString::fromUtf8("font-size: 16px;\n"
"margin-left: 3em;"));

        verticalLayout_6->addWidget(label_8);

        label_9 = new QLabel(groupBox_7);
        label_9->setObjectName(QString::fromUtf8("label_9"));
        label_9->setMinimumSize(QSize(0, 50));
        label_9->setFont(font);
        label_9->setStyleSheet(QString::fromUtf8("font-size: 16px;\n"
"margin-left: 3em;"));

        verticalLayout_6->addWidget(label_9);


        horizontalLayout_6->addWidget(groupBox_7);


        verticalLayout_3->addWidget(groupBox_8);

        groupBox_3 = new QGroupBox(introBox);
        groupBox_3->setObjectName(QString::fromUtf8("groupBox_3"));
        horizontalLayout_2 = new QHBoxLayout(groupBox_3);
        horizontalLayout_2->setObjectName(QString::fromUtf8("horizontalLayout_2"));
        m_showSeed = new QPushButton(groupBox_3);
        m_showSeed->setObjectName(QString::fromUtf8("m_showSeed"));
        m_showSeed->setMinimumSize(QSize(210, 30));
        m_showSeed->setMaximumSize(QSize(210, 30));
        m_showSeed->setFont(font);
        m_showSeed->setStyleSheet(QString::fromUtf8("QPushButton#m_showSeed\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_showSeed:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout_2->addWidget(m_showSeed);

        m_backButton = new QPushButton(groupBox_3);
        m_backButton->setObjectName(QString::fromUtf8("m_backButton"));
        m_backButton->setMinimumSize(QSize(210, 0));
        m_backButton->setMaximumSize(QSize(210, 30));
        m_backButton->setFont(font);
        m_backButton->setStyleSheet(QString::fromUtf8("QPushButton#m_backButton\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_backButton:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout_2->addWidget(m_backButton);


        verticalLayout_3->addWidget(groupBox_3, 0, Qt::AlignHCenter);

        label_12 = new QLabel(introBox);
        label_12->setObjectName(QString::fromUtf8("label_12"));
        QFont font1;
        font1.setFamily(QString::fromUtf8("Poppins"));
        label_12->setFont(font1);
        label_12->setStyleSheet(QString::fromUtf8("color: #aaa; "));
        label_12->setAlignment(Qt::AlignCenter);

        verticalLayout_3->addWidget(label_12);

        groupBox_4 = new QGroupBox(introBox);
        groupBox_4->setObjectName(QString::fromUtf8("groupBox_4"));
        horizontalLayout_3 = new QHBoxLayout(groupBox_4);
        horizontalLayout_3->setObjectName(QString::fromUtf8("horizontalLayout_3"));
        m_showPrivate = new QPushButton(groupBox_4);
        m_showPrivate->setObjectName(QString::fromUtf8("m_showPrivate"));
        m_showPrivate->setMinimumSize(QSize(200, 25));
        m_showPrivate->setMaximumSize(QSize(200, 25));
        m_showPrivate->setFont(font);
        m_showPrivate->setStyleSheet(QString::fromUtf8("QPushButton#m_showPrivate\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_showPrivate:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout_3->addWidget(m_showPrivate);

        m_showGUI = new QPushButton(groupBox_4);
        m_showGUI->setObjectName(QString::fromUtf8("m_showGUI"));
        m_showGUI->setMinimumSize(QSize(200, 25));
        m_showGUI->setMaximumSize(QSize(200, 25));
        m_showGUI->setFont(font);
        m_showGUI->setStyleSheet(QString::fromUtf8("QPushButton#m_showGUI\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_showGUI:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout_3->addWidget(m_showGUI);


        verticalLayout_3->addWidget(groupBox_4, 0, Qt::AlignHCenter);

        emptyLabelForAlignmentTop = new QLabel(introBox);
        emptyLabelForAlignmentTop->setObjectName(QString::fromUtf8("emptyLabelForAlignmentTop"));
        QSizePolicy sizePolicy(QSizePolicy::Expanding, QSizePolicy::MinimumExpanding);
        sizePolicy.setHorizontalStretch(0);
        sizePolicy.setVerticalStretch(0);
        sizePolicy.setHeightForWidth(emptyLabelForAlignmentTop->sizePolicy().hasHeightForWidth());
        emptyLabelForAlignmentTop->setSizePolicy(sizePolicy);
        emptyLabelForAlignmentTop->setMinimumSize(QSize(0, 0));
        emptyLabelForAlignmentTop->setMaximumSize(QSize(16777215, 16777215));
        emptyLabelForAlignmentTop->setSizeIncrement(QSize(0, 0));
        emptyLabelForAlignmentTop->setStyleSheet(QString::fromUtf8("border: none;"));

        verticalLayout_3->addWidget(emptyLabelForAlignmentTop);


        gridLayout->addWidget(introBox, 0, 0, 1, 1);

        guiKeyBox = new QGroupBox(groupBox);
        guiKeyBox->setObjectName(QString::fromUtf8("guiKeyBox"));
        guiKeyBox->setStyleSheet(QString::fromUtf8(""));
        verticalLayout_2 = new QVBoxLayout(guiKeyBox);
        verticalLayout_2->setObjectName(QString::fromUtf8("verticalLayout_2"));
        label_2 = new QLabel(guiKeyBox);
        label_2->setObjectName(QString::fromUtf8("label_2"));
        label_2->setFont(font);
        label_2->setStyleSheet(QString::fromUtf8("color: #ddd; font-size: 19px;"));
        label_2->setAlignment(Qt::AlignCenter);

        verticalLayout_2->addWidget(label_2);

        line_3 = new QFrame(guiKeyBox);
        line_3->setObjectName(QString::fromUtf8("line_3"));
        line_3->setStyleSheet(QString::fromUtf8("background-color: #333;"));
        line_3->setFrameShape(QFrame::HLine);
        line_3->setFrameShadow(QFrame::Sunken);

        verticalLayout_2->addWidget(line_3);

        groupBox_9 = new QGroupBox(guiKeyBox);
        groupBox_9->setObjectName(QString::fromUtf8("groupBox_9"));
        horizontalLayout_7 = new QHBoxLayout(groupBox_9);
        horizontalLayout_7->setObjectName(QString::fromUtf8("horizontalLayout_7"));
        m_guiKey = new QTextBrowser(groupBox_9);
        m_guiKey->setObjectName(QString::fromUtf8("m_guiKey"));
        m_guiKey->setMaximumSize(QSize(800, 16777215));
        m_guiKey->setFont(font);
        m_guiKey->setStyleSheet(QString::fromUtf8("font-size: 17px;"));

        horizontalLayout_7->addWidget(m_guiKey);


        verticalLayout_2->addWidget(groupBox_9);

        groupBox_2 = new QGroupBox(guiKeyBox);
        groupBox_2->setObjectName(QString::fromUtf8("groupBox_2"));
        horizontalLayout = new QHBoxLayout(groupBox_2);
        horizontalLayout->setObjectName(QString::fromUtf8("horizontalLayout"));
        m_copyGUIKeyButton = new QPushButton(groupBox_2);
        m_copyGUIKeyButton->setObjectName(QString::fromUtf8("m_copyGUIKeyButton"));
        QSizePolicy sizePolicy1(QSizePolicy::Minimum, QSizePolicy::Minimum);
        sizePolicy1.setHorizontalStretch(0);
        sizePolicy1.setVerticalStretch(0);
        sizePolicy1.setHeightForWidth(m_copyGUIKeyButton->sizePolicy().hasHeightForWidth());
        m_copyGUIKeyButton->setSizePolicy(sizePolicy1);
        m_copyGUIKeyButton->setMinimumSize(QSize(210, 30));
        m_copyGUIKeyButton->setMaximumSize(QSize(210, 30));
        m_copyGUIKeyButton->setFont(font);
        m_copyGUIKeyButton->setStyleSheet(QString::fromUtf8("QPushButton#m_copyGUIKeyButton\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_copyGUIKeyButton:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout->addWidget(m_copyGUIKeyButton);

        m_backButton_3 = new QPushButton(groupBox_2);
        m_backButton_3->setObjectName(QString::fromUtf8("m_backButton_3"));
        sizePolicy1.setHeightForWidth(m_backButton_3->sizePolicy().hasHeightForWidth());
        m_backButton_3->setSizePolicy(sizePolicy1);
        m_backButton_3->setMinimumSize(QSize(210, 30));
        m_backButton_3->setMaximumSize(QSize(210, 30));
        m_backButton_3->setFont(font);
        m_backButton_3->setStyleSheet(QString::fromUtf8("QPushButton#m_backButton_3\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_backButton_3:hover\n"
"{\n"
"    color: orange;\n"
"    border: 1px solid orange;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}"));

        horizontalLayout->addWidget(m_backButton_3);


        verticalLayout_2->addWidget(groupBox_2, 0, Qt::AlignHCenter);


        gridLayout->addWidget(guiKeyBox, 0, 0, 1, 1);

        privateKeyBox = new QGroupBox(groupBox);
        privateKeyBox->setObjectName(QString::fromUtf8("privateKeyBox"));
        privateKeyBox->setStyleSheet(QString::fromUtf8(""));
        verticalLayout_5 = new QVBoxLayout(privateKeyBox);
        verticalLayout_5->setObjectName(QString::fromUtf8("verticalLayout_5"));
        label_5 = new QLabel(privateKeyBox);
        label_5->setObjectName(QString::fromUtf8("label_5"));
        label_5->setFont(font);
        label_5->setStyleSheet(QString::fromUtf8("color: #ddd;font-size: 19px;"));
        label_5->setAlignment(Qt::AlignCenter);

        verticalLayout_5->addWidget(label_5);

        m_spendKey = new QTextBrowser(privateKeyBox);
        m_spendKey->setObjectName(QString::fromUtf8("m_spendKey"));
        m_spendKey->setMinimumSize(QSize(800, 0));
        m_spendKey->setFont(font);
        m_spendKey->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"font-size: 16px;"));

        verticalLayout_5->addWidget(m_spendKey, 0, Qt::AlignHCenter);

        label_6 = new QLabel(privateKeyBox);
        label_6->setObjectName(QString::fromUtf8("label_6"));
        label_6->setFont(font);
        label_6->setStyleSheet(QString::fromUtf8("color: #ddd; font-size: 19px;"));
        label_6->setAlignment(Qt::AlignCenter);

        verticalLayout_5->addWidget(label_6);

        m_viewKey = new QTextBrowser(privateKeyBox);
        m_viewKey->setObjectName(QString::fromUtf8("m_viewKey"));
        m_viewKey->setMinimumSize(QSize(800, 0));
        m_viewKey->setFont(font);
        m_viewKey->setStyleSheet(QString::fromUtf8("color: #ddd;\n"
"font-size: 16px;"));

        verticalLayout_5->addWidget(m_viewKey, 0, Qt::AlignHCenter);

        groupBox_5 = new QGroupBox(privateKeyBox);
        groupBox_5->setObjectName(QString::fromUtf8("groupBox_5"));
        horizontalLayout_4 = new QHBoxLayout(groupBox_5);
        horizontalLayout_4->setObjectName(QString::fromUtf8("horizontalLayout_4"));
        m_copySpendKeyButton = new QPushButton(groupBox_5);
        m_copySpendKeyButton->setObjectName(QString::fromUtf8("m_copySpendKeyButton"));
        m_copySpendKeyButton->setMinimumSize(QSize(210, 30));
        m_copySpendKeyButton->setMaximumSize(QSize(210, 30));
        m_copySpendKeyButton->setFont(font);
        m_copySpendKeyButton->setStyleSheet(QString::fromUtf8("QPushButton#m_copySpendKeyButton\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_copySpendKeyButton:hover\n"
"{\n"
"    color: black;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    background-color: #ffcb00;\n"
"}"));

        horizontalLayout_4->addWidget(m_copySpendKeyButton);

        m_copyViewKeyButton = new QPushButton(groupBox_5);
        m_copyViewKeyButton->setObjectName(QString::fromUtf8("m_copyViewKeyButton"));
        m_copyViewKeyButton->setMinimumSize(QSize(210, 30));
        m_copyViewKeyButton->setMaximumSize(QSize(210, 30));
        m_copyViewKeyButton->setFont(font);
        m_copyViewKeyButton->setStyleSheet(QString::fromUtf8("QPushButton#m_copyViewKeyButton\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_copyViewKeyButton:hover\n"
"{\n"
"    color: black;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    background-color: #ffcb00;\n"
"    \n"
"}"));

        horizontalLayout_4->addWidget(m_copyViewKeyButton);

        m_backButton_4 = new QPushButton(groupBox_5);
        m_backButton_4->setObjectName(QString::fromUtf8("m_backButton_4"));
        m_backButton_4->setMinimumSize(QSize(210, 30));
        m_backButton_4->setMaximumSize(QSize(210, 30));
        m_backButton_4->setFont(font);
        m_backButton_4->setStyleSheet(QString::fromUtf8("QPushButton#m_backButton_4\n"
"{\n"
"    color: #fff;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    \n"
"}\n"
"\n"
"QPushButton#m_backButton_4:hover\n"
"{\n"
"    color: black;\n"
"    border: 1px solid #ffcb00;\n"
"    font-size: 12px;\n"
"    border-radius: 5px;\n"
"    background-color: #ffcb00;\n"
"    \n"
"}"));

        horizontalLayout_4->addWidget(m_backButton_4);


        verticalLayout_5->addWidget(groupBox_5, 0, Qt::AlignHCenter);


        gridLayout->addWidget(privateKeyBox, 0, 0, 1, 1);

        introBox->raise();
        seedBox->raise();
        guiKeyBox->raise();
        privateKeyBox->raise();

        verticalLayout->addWidget(groupBox);


        retranslateUi(ReceiveFrame);
        QObject::connect(m_backButton, SIGNAL(clicked()), ReceiveFrame, SLOT(backClicked()));
        QObject::connect(m_copySeedButton, SIGNAL(clicked()), ReceiveFrame, SLOT(copySeedClicked()));
        QObject::connect(m_copyGUIKeyButton, SIGNAL(clicked()), ReceiveFrame, SLOT(copyGUIClicked()));
        QObject::connect(m_copyViewKeyButton, SIGNAL(clicked()), ReceiveFrame, SLOT(copyViewKeyClicked()));
        QObject::connect(m_copySpendKeyButton, SIGNAL(clicked()), ReceiveFrame, SLOT(copySpendKeyClicked()));
        QObject::connect(m_showSeed, SIGNAL(clicked()), ReceiveFrame, SLOT(showSeed()));
        QObject::connect(m_backButton_2, SIGNAL(clicked()), ReceiveFrame, SLOT(back2Clicked()));
        QObject::connect(m_backButton_3, SIGNAL(clicked()), ReceiveFrame, SLOT(back2Clicked()));
        QObject::connect(m_backButton_4, SIGNAL(clicked()), ReceiveFrame, SLOT(back2Clicked()));
        QObject::connect(m_showPrivate, SIGNAL(clicked()), ReceiveFrame, SLOT(showPrivate()));
        QObject::connect(m_showGUI, SIGNAL(clicked()), ReceiveFrame, SLOT(showGUI()));

        QMetaObject::connectSlotsByName(ReceiveFrame);
    } // setupUi

    void retranslateUi(QFrame *ReceiveFrame)
    {
        ReceiveFrame->setWindowTitle(QCoreApplication::translate("ReceiveFrame", "Frame", nullptr));
        label->setText(QCoreApplication::translate("ReceiveFrame", "WALLET KEY BACKUP", nullptr));
        groupBox->setTitle(QString());
        seedBox->setTitle(QString());
        label_7->setText(QCoreApplication::translate("ReceiveFrame", "YOUR 25 WORD MNEMONIC SEED", nullptr));
        m_seed->setHtml(QCoreApplication::translate("ReceiveFrame", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:'Poppins'; font-size:16px; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-size:11pt;\">Your wallet is an older format that does not support mnemonic seeds. Please generate a new wallet in order to get the 25 word Mnemonic seed and transfer your existing funds to your new wallet.</span></p></body></html>", nullptr));
        m_copySeedButton->setText(QCoreApplication::translate("ReceiveFrame", "COPY", nullptr));
        m_backButton_2->setText(QCoreApplication::translate("ReceiveFrame", "BACK", nullptr));
        introBox->setTitle(QString());
        label_10->setText(QCoreApplication::translate("ReceiveFrame", "We care about your safety: Please read the following", nullptr));
        groupBox_8->setTitle(QString());
        groupBox_7->setTitle(QString());
        label_3->setText(QCoreApplication::translate("ReceiveFrame", "\342\226\240  Keep your seed and password safe", nullptr));
        label_4->setText(QCoreApplication::translate("ReceiveFrame", "\342\226\240  Make a backup of your wallet file", nullptr));
        label_8->setText(QCoreApplication::translate("ReceiveFrame", "\342\226\240  Be aware of phishing websites and programs", nullptr));
        label_9->setText(QCoreApplication::translate("ReceiveFrame", "\342\226\240  Store a copy of your seed in a safe place", nullptr));
        m_showSeed->setText(QCoreApplication::translate("ReceiveFrame", "SHOW SEED", nullptr));
        m_backButton->setText(QCoreApplication::translate("ReceiveFrame", "BACK", nullptr));
        label_12->setText(QCoreApplication::translate("ReceiveFrame", "Advanced Users:", nullptr));
        m_showPrivate->setText(QCoreApplication::translate("ReceiveFrame", "PRIVATE KEYS", nullptr));
        m_showGUI->setText(QCoreApplication::translate("ReceiveFrame", "TRACKING KEY", nullptr));
        guiKeyBox->setTitle(QString());
        label_2->setText(QCoreApplication::translate("ReceiveFrame", "YOUR TRACKING KEY", nullptr));
        groupBox_9->setTitle(QString());
        m_guiKey->setHtml(QCoreApplication::translate("ReceiveFrame", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:'Poppins'; font-size:17px; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-size:11pt;\">Tracking key goes here</span></p></body></html>", nullptr));
        m_copyGUIKeyButton->setText(QCoreApplication::translate("ReceiveFrame", "COPY", nullptr));
        m_backButton_3->setText(QCoreApplication::translate("ReceiveFrame", "BACK", nullptr));
        privateKeyBox->setTitle(QString());
        label_5->setText(QCoreApplication::translate("ReceiveFrame", "PRIVATE SPEND KEY", nullptr));
        m_spendKey->setHtml(QCoreApplication::translate("ReceiveFrame", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:'Poppins'; font-size:16px; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-family:'Courier'; font-size:10pt;\">private spend key goes here</span></p></body></html>", nullptr));
        label_6->setText(QCoreApplication::translate("ReceiveFrame", "PRIVATE VIEW KEY", nullptr));
        m_viewKey->setHtml(QCoreApplication::translate("ReceiveFrame", "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 4.0//EN\" \"http://www.w3.org/TR/REC-html40/strict.dtd\">\n"
"<html><head><meta name=\"qrichtext\" content=\"1\" /><style type=\"text/css\">\n"
"p, li { white-space: pre-wrap; }\n"
"</style></head><body style=\" font-family:'Poppins'; font-size:16px; font-weight:400; font-style:normal;\">\n"
"<p style=\" margin-top:0px; margin-bottom:0px; margin-left:0px; margin-right:0px; -qt-block-indent:0; text-indent:0px;\"><span style=\" font-family:'Courier'; font-size:10pt;\">private view key goes here</span></p></body></html>", nullptr));
        m_copySpendKeyButton->setText(QCoreApplication::translate("ReceiveFrame", "COPY SPEND KEY", nullptr));
        m_copyViewKeyButton->setText(QCoreApplication::translate("ReceiveFrame", "COPY VIEW KEY", nullptr));
        m_backButton_4->setText(QCoreApplication::translate("ReceiveFrame", "BACK", nullptr));
    } // retranslateUi

};

namespace Ui {
    class ReceiveFrame: public Ui_ReceiveFrame {};
} // namespace Ui

QT_END_NAMESPACE

#endif // UI_RECEIVEFRAME_H
